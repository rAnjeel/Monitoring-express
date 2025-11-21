import pm2 from 'pm2';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../logger/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENTS_BASE = path.resolve(__dirname, '../../../agents');

const AGENT_CONFIG = [
    {
        key: 'ping',
        name: 'ping-agent',
        script: path.join(AGENTS_BASE, 'launcher/ping-launcher.js'),
        instancesEnv: 'AGENT_PING_INSTANCES',
        defaultInstances: 1,
    },
    {
        key: 'traffic',
        name: 'traffic-agent',
        script: path.join(AGENTS_BASE, 'launcher/traffic-launcher.js'),
        instancesEnv: 'AGENT_TRAFFIC_INSTANCES',
        defaultInstances: 1,
    },
];

function connectPm2() {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
}

function disconnectPm2() {
    return new Promise((resolve) => {
        try {
            pm2.disconnect();
        } catch (_) {
            // noop
        }
        resolve();
    });
}

function listProcesses() {
    return new Promise((resolve, reject) => {
        pm2.list((err, list) => {
            if (err) return reject(err);
            resolve(Array.isArray(list) ? list : []);
        });
    });
}

function startProcess(config, overrideInstances) {
    let instances = undefined;

    if (overrideInstances != null) {
        const n = Number(overrideInstances);
        if (Number.isFinite(n) && n > 0) {
            instances = n;
        }
    }

    if (!Number.isFinite(instances) || instances <= 0) {
        const rawInstances = process.env[config.instancesEnv];
        const fallback = rawInstances != null ? rawInstances : config.defaultInstances;
        const n = Number(fallback);
        instances = Number.isFinite(n) && n > 0 ? n : 1;
    }

    const options = {
        name: config.name,
        script: config.script,
        cwd: path.dirname(config.script),
        instances,
        exec_mode: 'cluster',
    };

    logger.info(`[SupervisionPm2] Starting process ${config.name} (script=${config.script}, instances=${instances})`);

    return new Promise((resolve, reject) => {
        pm2.start(options, (err, proc) => {
            if (err) return reject(err);
            resolve(proc);
        });
    });
}

function deleteProcess(name) {
    return new Promise((resolve, reject) => {
        pm2.delete(name, (err) => {
            if (err) {
                const msg = String(err.message || err);
                if (msg.includes('process name not found') || msg.includes('process or namespace not found')) {
                    return resolve();
                }
                return reject(err);
            }
            resolve();
        });
    });
}

async function getStatusInternal() {
    const list = await listProcesses();
    return AGENT_CONFIG.map((cfg) => {
        const proc = list.find((p) => p.name === cfg.name);
        return {
            key: cfg.key,
            name: cfg.name,
            script: cfg.script,
            status: proc?.pm2_env?.status || 'stopped',
            instances: proc?.pm2_env?.instances || 0,
            pm_id: proc?.pm_id ?? null,
        };
    });
}

class SupervisionPm2Service {
    startSupervision = async (options = {}) => {
        await connectPm2();
        try {
            const list = await listProcesses();
            for (const cfg of AGENT_CONFIG) {
                const existing = list.find((p) => p.name === cfg.name);
                if (existing && existing.pm2_env && existing.pm2_env.status === 'online') {
                    logger.info(`[SupervisionPm2] Process ${cfg.name} already online, skipping start`);
                    continue;
                }
                try {
                    const overrideKey = `${cfg.key}Instances`;
                    const overrideVal = options[overrideKey];
                    await startProcess(cfg, overrideVal);
                } catch (e) {
                    logger.error(`[SupervisionPm2] Failed to start ${cfg.name}: ${e.message}`);
                    throw e;
                }
            }
            const processes = await getStatusInternal();
            return { processes };
        } finally {
            await disconnectPm2();
        }
    };

    stopSupervision = async () => {
        await connectPm2();
        try {
            for (const cfg of AGENT_CONFIG) {
                try {
                    await deleteProcess(cfg.name);
                    logger.info(`[SupervisionPm2] Deleted process ${cfg.name}`);
                } catch (e) {
                    logger.error(`[SupervisionPm2] Error deleting ${cfg.name}: ${e.message}`);
                }
            }
            const processes = await getStatusInternal();
            return { processes };
        } finally {
            await disconnectPm2();
        }
    };

    getStatus = async () => {
        await connectPm2();
        try {
            const processes = await getStatusInternal();
            return { processes };
        } finally {
            await disconnectPm2();
        }
    };
}

const supervisionPm2Service = new SupervisionPm2Service();
export default supervisionPm2Service;
