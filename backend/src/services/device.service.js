import db from '../config/db.js';
import { devices } from '../models/device.model.js';
import { locations } from '../models/location.model.js';
import { typeDevices } from '../models/typeDevice.model.js';
import { eq, sql, like, or, and } from 'drizzle-orm';
import logger from '../logger/logger.js';
import utilService from './util.service.js';
import consumer from './messaging/consumer.service.js';
import deviceEventService from './deviceEvent.service.js';
import SocketService from './socket/socket.service.js';

class DeviceService {
  constructor() {
    this.updateBuffer = new Map()
    this.flushTimer = null
    this.batchIntervalMs = Number(process.env.BATCH_SQL_INTERVAL_MS || 3000)
    this.batchMaxPerTick = Number(process.env.BATCH_SQL_MAX || 200)
    this.ipToDeviceIdCache = new Map()
    this.ipCacheMaxSize = Number(process.env.IP_CACHE_MAX || 10000)
  }

  queueUpdate = (id, partialData) => {
    const deviceId = Number(id)
    if (!this.updateBuffer.has(deviceId)) {
      this.updateBuffer.set(deviceId, { ...partialData })
    } else {
      const existing = this.updateBuffer.get(deviceId) || {}
      this.updateBuffer.set(deviceId, { ...existing, ...partialData })
    }
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flushUpdates(), this.batchIntervalMs)
    }
  }

  flushUpdates = async () => {
    try {
      const entries = Array.from(this.updateBuffer.entries())
      if (entries.length === 0) {
        clearTimeout(this.flushTimer)
        this.flushTimer = null
        return
      }
      const slice = entries.slice(0, this.batchMaxPerTick)
      for (const [id, data] of slice) {
        try {
          await db.update(devices).set(data).where(eq(devices.id, id))
        } catch (e) {
          logger.error(`[BatchSQL] Erreur update device id=${id}: ${e.message}`)
        } finally {
          this.updateBuffer.delete(id)
        }
      }
    } finally {
      if (this.updateBuffer.size > 0) {
        this.flushTimer = setTimeout(() => this.flushUpdates(), this.batchIntervalMs)
      } else {
        clearTimeout(this.flushTimer)
        this.flushTimer = null
      }
    }
  }
  list = async () => {
    try {
      logger.info('Fetching all devices');
      const result = await db.select().from(devices);
      logger.info(`Fetched ${result.length} devices`);
      return result;
    } catch (error) {
      logger.error(`Error fetching devices: ${error.message}`);
      throw new Error('Database error while fetching devices');
    }
  }

  get = async (id) => {
    try {
      logger.info(`Fetching device id=${id}`);
      const result = await db.select().from(devices).where(eq(devices.id, id));
      if (result.length > 0) {
        logger.info(`Device found: ${JSON.stringify(result[0])}`);
      } else {
        logger.warn(`Device id=${id} not found`);
      }
      return result;
    } catch (error) {
      logger.error(`Error fetching device id=${id}: ${error.message}`);
      throw new Error('Database error while fetching device');
    }
  }

  create = async (data) => {
    try {
      logger.info(`Creating device ip=${data.ip}, hostname=${data.hostname}`);
      const result = await db.insert(devices).values(data);
      logger.info(`Device created with insertId=${result.insertId || 'unknown'}`);
      return result.insertId;
    } catch (error) {
      logger.error(`Error creating device: ${error.message}`);
      throw new Error('Database error while creating device');
    }
  }

  update = async (id, data) => {
    try {
      logger.info(`Updating device id=${id}`);
      const result = await db.update(devices).set(data).where(eq(devices.id, id));
      logger.info(`Update result for device id=${id}: ${JSON.stringify(result)}`);
      // enqueue bulk device update
      try { SocketService.enqueueDeviceUpdate(id) } catch {}
      return result;
    } catch (error) {
      logger.error(`Error updating device id=${id}: ${error.message}`);
      throw new Error('Database error while updating device');
    }
  }

  delete = async (id) => {
    try {
      logger.info(`Deleting device id=${id}`);
      const result = await db.delete(devices).where(eq(devices.id, id));
      logger.info(`Delete result for device id=${id}: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting device id=${id}: ${error.message}`);
      throw new Error('Database error while deleting device');
    }
  }

  importDataCSV = async (data) => {
    if (!Array.isArray(data)) {
      logger.warn('importDataCSV received non-array payload');
      return { data: [], count: 0 };
    }

    const rows = data.map((row, index) => {
      try {
        logger.info(`CSV row ${index + 1}: ${JSON.stringify(row)}`);
      } catch {
        logger.warn(`CSV row ${index + 1}: [unserializable row]`);
      }

      return {
        device_id: utilService.toIntOrNull(row.device_id),
        id: utilService.toIntOrNull(row.id),
        ip: utilService.toNull(row.ip),
        sysName: utilService.toNull(row.sysName),
        hostname: utilService.toNull(row.hostname),
        ping_status: utilService.toBoolean(row.Ping_status),
        status: utilService.toIntOrNull(row.status),
        type_device_id: utilService.toIntOrNull(row.type_device_id),
        location_id: utilService.toIntOrNull(row.location_id),
        codesite: utilService.toNull(row.codesite),
        loss: utilService.toFloatOrNull(row.loss),
        avg: utilService.toFloatOrNull(row.avg),
        min: utilService.toFloatOrNull(row.min),
        max: utilService.toFloatOrNull(row.max),
        uptime: utilService.toDateOrNull(row.uptime),
        snmp_disable: row.snmp_disable ? utilService.toBoolean(row.snmp_disable) : true,
        community: utilService.toNull(row.community),
        authlevel: utilService.toNull(row.authlevel),
        authname: utilService.toNull(row.authname),
        authpass: utilService.toNull(row.authpass),
        authalgo: utilService.toNull(row.authalgo),
        cryptopass: utilService.toNull(row.cryptopass),
        cryptoalgo: utilService.toNull(row.cryptoalgo),
        snmpver: utilService.toNull(row.snmpver),
        ne_id: utilService.toIntOrNull(row.ne_id),
      };
    });

    let createdOrUpdated = 0;
    const errors = [];
    const successHostnames = [];
    const errorHostnames = [];

    for (const row of rows) {
      try {
        await db
          .insert(devices)
          .values(row)
          .onDuplicateKeyUpdate({ set: { ...row } });

        logger.info(`Created/updated device_id=${row.device_id} hostname=${row.hostname}`);
        if (row.hostname) successHostnames.push(row.hostname);
        createdOrUpdated++;
      } catch (e) {
        logger.error(`Insert/upsert failed for device_id=${row.device_id}: ${e.message}`);
        errors.push({ device_id: row.device_id, hostname: row.hostname, error: e.message });
        if (row.hostname) errorHostnames.push(row.hostname);
      }
    }

    return {
      data: rows,
      count: rows.length,
      createdOrUpdated,
      errors,
      successHostnames,
      errorHostnames,
    };
  }

  getFullList = async (filter = {}) => {
    try {
      let query = db
        .select({
          device_id: devices.device_id,
          id: devices.id,
          sysName: devices.sysName,
          hostname: devices.hostname,
          type_device: typeDevices.name,
          location: locations.name,
          ping_status: devices.ping_status,
          status: devices.status,
          codesite: devices.codesite,
          loss: devices.loss,
          avg: devices.avg,
          min: devices.min,
          max: devices.max,
          uptime: devices.uptime,
          snmp_disable: devices.snmp_disable,
          community: devices.community,
          authlevel: devices.authlevel,
          authname: devices.authname,
          authalgo: devices.authalgo,
          cryptopass: devices.cryptopass,
          cryptoalgo: devices.cryptoalgo,
          snmpver: devices.snmpver,
        })
        .from(devices)
        .leftJoin(typeDevices, eq(typeDevices.id, devices.type_device_id))
        .leftJoin(locations, eq(locations.id, devices.location_id));

      if (Object.keys(filter).length > 0) {
        const conditions = [];

        // Parcours chaque clé pour créer un LIKE
        for (const [key, value] of Object.entries(filter)) {
          if (!value) continue;
          const search = `%${value}%`;

          switch (key) {
            case 'key':
              // recherche globale
              conditions.push(or(
                like(devices.hostname, search),
                like(devices.sysName, search),
                like(typeDevices.name, search),
                like(locations.name, search),
                like(devices.codesite, search)
              ));
              break;
            case 'type_device':
              conditions.push(like(typeDevices.name, search));
              break;
            case 'location':
              conditions.push(like(locations.name, search));
              break;
            case 'hostname':
              conditions.push(like(devices.hostname, search));
              break;
            case 'sysName':
              conditions.push(like(devices.sysName, search));
              break;
            // ajouter d'autres champs selon besoin
            default:
              break;
          }
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }

      const rows = await query;
      return rows;
    } catch (error) {
      logger.error(`Error fetching devices with filter (drizzle): ${error.message}`);
      throw error;
    }
  }


  getDevicesPage = async ({ page = 1, pageSize = 20, filter = {} } = {}) => {
    try {
      const offset = (page - 1) * pageSize;

      // Base query avec jointures
      let rowsQuery = db
        .select({
          device_id: devices.device_id,
          id: devices.id,
          sysName: devices.sysName,
          hostname: devices.hostname,
          type_device: typeDevices.name,
          location: locations.name,
          ping_status: devices.ping_status,
          status: devices.status,
          codesite: devices.codesite,
          loss: devices.loss,
          avg: devices.avg,
          min: devices.min,
          max: devices.max,
          uptime: devices.uptime,
          snmp_disable: devices.snmp_disable,
          community: devices.community,
          authlevel: devices.authlevel,
          authname: devices.authname,
          authalgo: devices.authalgo,
          cryptopass: devices.cryptopass,
          cryptoalgo: devices.cryptoalgo,
          snmpver: devices.snmpver,
        })
        .from(devices)
        .leftJoin(typeDevices, eq(typeDevices.id, devices.type_device_id))
        .leftJoin(locations, eq(locations.id, devices.location_id));

      // Construit les conditions (supporte multi-sélection via tableaux)
      if (filter && Object.keys(filter).length > 0) {
        const conditions = [];

        for (const [key, value] of Object.entries(filter)) {
          if (value === undefined || value === null || value === '') continue;

          const values = Array.isArray(value) ? value : [value];

          switch (key) {
            case 'key': {
              // Pour chaque terme, on cherche dans plusieurs colonnes, puis OR entre les termes
              const perTermOrGroups = values.map(v => {
                const s = `%${v}%`;
                return or(
                  like(devices.hostname, s),
                  like(devices.sysName, s),
                  like(typeDevices.name, s),
                  like(locations.name, s),
                  like(devices.codesite, s)
                );
              });
              conditions.push(or(...perTermOrGroups));
              break;
            }
            case 'type_device': {
              const orGroup = values.map(v => like(typeDevices.name, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'location': {
              const orGroup = values.map(v => like(locations.name, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'hostname': {
              const orGroup = values.map(v => like(devices.hostname, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'sysName': {
              const orGroup = values.map(v => like(devices.sysName, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            default:
              break;
          }
        }

        if (conditions.length > 0) {
          rowsQuery = rowsQuery.where(and(...conditions));
        }
      }

      // Pagination
      const rows = await rowsQuery.limit(pageSize).offset(offset);

      // Compte total avec le même filtre
      let countQuery = db
        .select({ count: sql`count(*)`.as('count') })
        .from(devices)
        .leftJoin(typeDevices, eq(typeDevices.id, devices.type_device_id))
        .leftJoin(locations, eq(locations.id, devices.location_id));

      if (filter && Object.keys(filter).length > 0) {
        const conditions = [];

        for (const [key, value] of Object.entries(filter)) {
          if (value === undefined || value === null || value === '') continue;

          const values = Array.isArray(value) ? value : [value];

          switch (key) {
            case 'key': {
              const perTermOrGroups = values.map(v => {
                const s = `%${v}%`;
                return or(
                  like(devices.hostname, s),
                  like(devices.sysName, s),
                  like(typeDevices.name, s),
                  like(locations.name, s),
                  like(devices.codesite, s)
                );
              });
              conditions.push(or(...perTermOrGroups));
              break;
            }
            case 'type_device': {
              const orGroup = values.map(v => like(typeDevices.name, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'location': {
              const orGroup = values.map(v => like(locations.name, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'hostname': {
              const orGroup = values.map(v => like(devices.hostname, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'sysName': {
              const orGroup = values.map(v => like(devices.sysName, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            default:
              break;
          }
        }

        if (conditions.length > 0) {
          countQuery = countQuery.where(and(...conditions));
        }
      }

      const totalCountResult = await countQuery;
      const totalCount = Number(totalCountResult?.[0]?.count || 0);

      return { rows, totalCount };
    } catch (error) {
      logger.error(`Error fetching paginated devices (drizzle): ${error.message}`);
      throw error;
    }
  }

  startPingConsumer = async () => {
    await consumer.start(async (pingResult) => {
      try {
        logger.info(`[PingConsumer] Message reçu: ${JSON.stringify(pingResult)}`);
        const { ip, lossPct, avg, min, max } = pingResult;

        // Chercher le device correspondant à l'IP avec cache
        let deviceId = this.ipToDeviceIdCache.get(ip)
        if (!deviceId) {
          const existing = await db.select().from(devices).where(eq(devices.hostname, ip));
          if (!existing || existing.length === 0) {
            logger.warn(`[PingConsumer] Aucun device trouvé avec ip=${ip}`);
            return;
          }
          deviceId = existing[0].id
          if (this.ipToDeviceIdCache.size >= this.ipCacheMaxSize) {
            const firstKey = this.ipToDeviceIdCache.keys().next().value
            this.ipToDeviceIdCache.delete(firstKey)
          }
          this.ipToDeviceIdCache.set(ip, deviceId)
        }
        logger.info(`[PingConsumer] Device id=${deviceId}, ip=${ip}`, JSON.stringify(pingResult));
        const lossThreshold = parseFloat(process.env.PING_LOSS_THRESHOLD);
        logger.info(`[PingConsumer] Loss threshold=${lossThreshold}`);
        const isUp = lossPct <= lossThreshold;
        
        const updateData = {
          ping_status: isUp,
          loss: lossPct,
          avg,
          min,
          max,
        };
        
        if (isUp) {
          updateData.uptime = new Date();
        }
        
        // Enqueue DB update (batched)
        this.queueUpdate(deviceId, updateData)

        // Enqueue bulk device update
        try { SocketService.enqueueDeviceUpdate(deviceId) } catch (e) {
          logger.warn(`[PingConsumer] enqueue devices:bulk_update échouée: ${e.message}`)
        }
          
        // Créer un événement pour tracer le changement de statut (async fire-and-forget)
        Promise.resolve().then(async () => {
          try {
            await deviceEventService.createStatusChangeEvent(deviceId, isUp, {
              loss: lossPct,
              avg,
              min,
              max
            })
            try { SocketService.emitToAll('deviceEvents:created', { device_id: deviceId }) } catch {}
          } catch (eventError) {
            logger.error(`[PingConsumer] Erreur création événement: ${eventError.message}`)
          }
        })
          
        logger.info(`[PingConsumer] Device ${deviceId} mis à jour: loss=${lossPct}%, threshold=${lossThreshold}%, status=${isUp ? 'UP' : 'DOWN'}`);
        logger.info(`[PingConsumer] Device id=${deviceId}, ip=${ip} mis à jour avec succès`);
      } catch (err) {
        logger.error(`[PingConsumer] Erreur traitement message: ${err.message}`);
      }
    });
  }
}

export default new DeviceService();
