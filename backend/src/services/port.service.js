import { db, mysqlPool } from '../config/db.js';
import { ports } from '../models/port.model.js';
import { devices } from '../models/device.model.js';
import { eq, sql, like, or, and } from 'drizzle-orm';
import logger from '../logger/logger.js';
import utilService from './util.service.js';
import ConsumerService from './messaging/consumer.service.js';
import SocketService from './socket/socket.service.js';

class PortService {
  list = async () => {
    try {
      logger.info('Fetching all ports');
      const result = await db.select().from(ports);
      logger.info(`Fetched ${result.length} ports`);
      return result;
    } catch (error) {
      logger.error(`Error fetching ports: ${error.message}`);
      throw new Error('Database error while fetching ports');
    }
  }

  get = async (id) => {
    try {
      logger.info(`Fetching port id=${id}`);
      const result = await db.select().from(ports).where(eq(ports.id, id));
      return result;
    } catch (error) {
      logger.error(`Error fetching port id=${id}: ${error.message}`);
      throw new Error('Database error while fetching port');
    }
  }

  create = async (data) => {
    try {
      logger.info(`Creating port for device_id=${data.device_id} ifName=${data.ifName || ''}`);
      const result = await db.insert(ports).values(data);
      logger.info(`Port created with insertId=${result.insertId || 'unknown'}`);
      return result.insertId;
    } catch (error) {
      logger.error(`Error creating port: ${error.message}`);
      throw new Error('Database error while creating port');
    }
  }

  update = async (id, data) => {
    try {
      logger.info(`Updating port id=${id}`);
      const result = await db.update(ports).set(data).where(eq(ports.id, id));
      return result;
    } catch (error) {
      logger.error(`Error updating port id=${id}: ${error.message}`);
      throw new Error('Database error while updating port');
    }
  }

  switchMonitored = async (port_id, isMonitored) => {
    try {
      logger.info(`Switching monitored status for port id=${port_id} to ${isMonitored}`);
      const result = await db.update(ports).set({ isMonitored: isMonitored }).where(eq(ports.port_id, port_id));
      return result;
    } catch (error) {
      logger.error(`Error switching monitored status for port id=${port_id}: ${error.message}`);
      throw new Error('Database error while switching monitored status');
    }
  }

  delete = async (id) => {
    try {
      logger.info(`Deleting port id=${id}`);
      const result = await db.delete(ports).where(eq(ports.id, id));
      return result;
    } catch (error) {
      logger.error(`Error deleting port id=${id}: ${error.message}`);
      throw new Error('Database error while deleting port');
    }
  }


  importPortsCSV = async (data) => {
    if (!Array.isArray(data)) {
      logger.warn('importPortsCSV received non-array payload');
      return { data: [], count: 0 };
    }

    const rows = data.map((row, index) => {
      try {
        logger.info(`CSV port row ${index + 1}: ${JSON.stringify(row)}`);
      } catch {
        logger.warn(`CSV port row ${index + 1}: [unserializable row]`);
      }

      return {
        port_id: utilService.toIntOrNull(row.port_id),
        device_id: utilService.toIntOrNull(row.device_id),
        ifName: utilService.toNull(row.ifName),
        ifDescr: utilService.toNull(row.ifDescr),
        ifAlias: utilService.toNull(row.ifAlias),
        ifInOctets: utilService.toIntOrNull(row.ifInOctets),
        ifOutOctets: utilService.toIntOrNull(row.ifOutOctets),
        ifOperStatus: utilService.toNull(row.ifOperStatus),
        ifAdminStatus: utilService.toNull(row.ifAdminStatus),
        ifMtu: utilService.toIntOrNull(row.ifMtu),
        ifType: utilService.toNull(row.ifType),
        ifPhysAddress: utilService.toNull(row.ifPhysAddress),
        ifLastChange: utilService.toIntOrNull(row.ifLastChange),
        ifHighSpeed: utilService.toIntOrNull(row.ifHighSpeed),
        ifPromiscuousMode: utilService.toBoolean(row.ifPromiscuousMode),
        ifConnectorPresent: utilService.toBoolean(row.ifConnectorPresent),
        ifSpeed: utilService.toIntOrNull(row.ifSpeed),
        ifIndex: utilService.toIntOrNull(row.ifIndex),
        ne_id: utilService.toNull(row.ne_id),
      };
    });

    let createdOrUpdated = 0;
    const errors = [];
    const successPorts = [];
    const errorPorts = [];

    for (const row of rows) {
      try {
        await db
          .insert(ports)
          .values(row)
          .onDuplicateKeyUpdate({ set: { ...row } });

        logger.info(
          `Created/updated port_id=${row.port_id} device_id=${row.device_id} ifName=${row.ifName}`
        );

        if (row.ifName) successPorts.push(row.ifName);
        createdOrUpdated++;
      } catch (e) {
        logger.error(
          `Insert/upsert failed for port_id=${row.port_id} device_id=${row.device_id}: ${e.message}`
        );
        errors.push({
          port_id: row.port_id,
          device_id: row.device_id,
          ifName: row.ifName,
          error: e.message,
        });
        if (row.ifName) errorPorts.push(row.ifName);
      }
    }

    return {
      data: rows,
      count: rows.length,
      createdOrUpdated,
      errors,
      successPorts,
      errorPorts,
    };
  }  

  getFullList = async () => {
    try {
      logger.info('Fetching ports with device names');
      const rows = await db
        .select({
          port_id: ports.port_id,
          device_id: ports.device_id,
          IfIndex: ports.ifIndex,
          hostname: devices.hostname,
          sysName: devices.sysName,
          type: ports.ifType,
          name: ports.ifName,
          description: ports.ifAlias,
          in_octets: ports.ifInOctets,
          out_octets: ports.ifOutOctets,
          operStatus: ports.ifOperStatus,
          adminStatus: ports.ifAdminStatus,
          mtu: ports.ifMtu,
          PhysAddress: ports.ifPhysAddress,
          HighSpeed: ports.ifHighSpeed,
          PromiscuousMode: ports.ifPromiscuousMode,
          ConnectorPresent: ports.ifConnectorPresent,
          Speed: ports.ifSpeed,
        })
        .from(ports)
        .leftJoin(devices, eq(devices.id, ports.device_id));
      logger.info(`Fetched ${rows.length} ports (with device names)`);
      return rows;
    } catch (error) {
      logger.error(`Error fetching ports with device names (drizzle): ${error.message}`);
      throw error;
    }
  }

  getPortsPage = async ({ page = 1, pageSize = 20, filter = {} } = {}) => {
    try {
      logger.info('Fetching ports with device names and pagination');
      const offset = (page - 1) * pageSize;

      // Base select avec jointure
      let rowsQuery = db
        .select({
          port_id: ports.port_id,
          device_id: ports.device_id,
          ifIndex: ports.ifIndex,
          status: ports.status,
          isMonitored: ports.isMonitored,
          hostname: devices.hostname,
          sysName: devices.sysName,
          type: ports.ifType,
          name: ports.ifName,
          description: ports.ifAlias,
          Speed: ports.ifSpeed,
          in_octets: ports.ifInOctets,
          out_octets: ports.ifOutOctets,
          operStatus: ports.ifOperStatus,
          adminStatus: ports.ifAdminStatus,
          mtu: ports.ifMtu,
          PhysAddress: ports.ifPhysAddress,
          HighSpeed: ports.ifHighSpeed,
          PromiscuousMode: ports.ifPromiscuousMode,
          ConnectorPresent: ports.ifConnectorPresent,
        })
        .from(ports)
        .leftJoin(devices, eq(devices.id, ports.device_id));

      // Filtres
      if (filter && Object.keys(filter).length > 0) {
        const conditions = [];

        for (const [key, value] of Object.entries(filter)) {
          if (value === undefined || value === null || value === '') continue;
          const values = Array.isArray(value) ? value : [value];

          switch (key) {
            case 'status': {
              const orGroup = values.map(v => like(ports.status, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'key': {
              const perTerm = values.map(v => {
                const s = `%${v}%`;
                return or(
                  like(ports.ifName, s),
                  like(ports.ifDescr, s),
                  like(ports.ifAlias, s),
                  like(devices.hostname, s),
                  like(devices.sysName, s)
                );
              });
              conditions.push(or(...perTerm));
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
            case 'name': {
              const orGroup = values.map(v => like(ports.ifName, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'description': {
              const orGroup = values.map(v => like(ports.ifAlias, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'type': {
              const orGroup = values.map(v => like(ports.ifType, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'operStatus': {
              const orGroup = values.map(v => like(ports.ifOperStatus, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'adminStatus': {
              const orGroup = values.map(v => like(ports.ifAdminStatus, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'isMonitored': {
              conditions.push(eq(ports.isMonitored, value));
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

      const rows = await rowsQuery.limit(pageSize).offset(offset);
      logger.info(`Fetched ${rows.length} ports (with device names and pagination)`);

      // Total filtré
      let countQuery = db
        .select({ count: sql`count(*)`.as('count') })
        .from(ports)
        .leftJoin(devices, eq(devices.id, ports.device_id));

      if (filter && Object.keys(filter).length > 0) {
        const conditions = [];

        for (const [key, value] of Object.entries(filter)) {
          if (value === undefined || value === null || value === '') continue;
          const values = Array.isArray(value) ? value : [value];

          switch (key) {
            case 'status': {
              const orGroup = values.map(v => like(ports.status, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'key': {
              const perTerm = values.map(v => {
                const s = `%${v}%`;
                return or(
                  like(ports.ifName, s),
                  like(ports.ifDescr, s),
                  like(ports.ifAlias, s),
                  like(devices.hostname, s),
                  like(devices.sysName, s)
                );
              });
              conditions.push(or(...perTerm));
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
            case 'name': {
              const orGroup = values.map(v => like(ports.ifName, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'description': {
              const orGroup = values.map(v => like(ports.ifAlias, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'type': {
              const orGroup = values.map(v => like(ports.ifType, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'operStatus': {
              const orGroup = values.map(v => like(ports.ifOperStatus, `%${v}%`));
              conditions.push(or(...orGroup));
              break;
            }
            case 'adminStatus': {
              const orGroup = values.map(v => like(ports.ifAdminStatus, `%${v}%`));
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
      logger.error(`Error fetching paginated ports (drizzle): ${error.message}`);
      throw error;
    }
  }

  getPortsGroupedByDevice = async () => {
    try {
      logger.info('Fetching isMonitored ports grouped by device_id')
      const rows = await db
        .select({ device_id: ports.device_id, port_id: ports.port_id, ifInOctets: ports.ifInOctets, ifOutOctets: ports.ifOutOctets, ifAdminStatus: ports.ifAdminStatus, ifOperStatus: ports.ifOperStatus })
        .from(ports)
        .where(eq(ports.isMonitored, true))

      const deviceIdToPorts = new Map()
      for (const r of rows) {
        const did = r.device_id
        const pid = r.port_id
        if (did == null || pid == null) continue
        if (!deviceIdToPorts.has(did)) deviceIdToPorts.set(did, [])
        deviceIdToPorts.get(did).push({ port_id: pid, ifInOctets: r.ifInOctets, ifOutOctets: r.ifOutOctets, ifAdminStatus: r.ifAdminStatus, ifOperStatus: r.ifOperStatus })
      }

      const result = Array.from(deviceIdToPorts.entries()).map(([device_id, ports_stats]) => ({ device_id, ports: ports_stats }))
      logger.info(`Grouped ${result.length} device groups for admin UP ports`)
      return result
    } catch (error) {
      logger.error(`Error fetching isMonitored ports grouped by device: ${error.message}`)
      throw error
    }
  }

  startTrafficConsumer = async () => {
    const queueName = process.env.RABBIT_QUEUE_TRAFFIC || 'traffic_results'
    const consumer = new ConsumerService(queueName)
    await consumer.start(async (trafficResult) => {
      try {
        const deviceId = trafficResult?.device_id
        const portsArr = Array.isArray(trafficResult?.ports) ? trafficResult.ports : []
        const ts = trafficResult?.ts
        if (deviceId == null || portsArr.length === 0) {
          logger.warn(`[TrafficConsumer] Message invalide: device_id=${deviceId}, ports_count=${portsArr.length}`)
          return
        }

        const tsStr = new Date(ts).toISOString().slice(0, 19).replace('T', ' ')
        const updatedPortsForSocket = []

        await Promise.all(portsArr.map(async (p) => {
          const portId = p?.port_id
          const inOctets = Number(p?.inOctets) || 0
          const outOctets = Number(p?.outOctets) || 0
          const statusStr = p?.status

          try {
            await mysqlPool.execute(
              'UPDATE ports SET ifInOctets = ?, ifOutOctets = ?, status = ? WHERE port_id = ? AND device_id = ?',
              [inOctets, outOctets, statusStr, portId, deviceId]
            )
            logger.info(`[TrafficConsumer] Port ${portId} updated: inOctets=${inOctets}, outOctets=${outOctets}, status=${statusStr}`)
          } catch (updateError) {
            logger.error(`[TrafficConsumer] Erreur UPDATE port ${portId}: ${updateError.message}`)
          }

          try {
            await mysqlPool.execute(
              'INSERT INTO port_events (port_id, ifInOctets, ifOutOctets, status, event_time) VALUES (?, ?, ?, ?, ?)',
              [portId, inOctets, outOctets, statusStr, tsStr]
            )
            logger.info(`[TrafficConsumer] Port event ${portId} inserted: inOctets=${inOctets}, outOctets=${outOctets}, status=${statusStr}`)
          } catch (insertError) {
            logger.error(`[TrafficConsumer] Erreur INSERT port event ${portId}: ${insertError.message}`)
          }

          updatedPortsForSocket.push({ port_id: portId, device_id: deviceId, ifInOctets: inOctets, ifOutOctets: outOctets, status: statusStr })
        }))

        try { 
          SocketService.emitToAll('ports:bulk_update', updatedPortsForSocket)
          logger.info(`[TrafficConsumer] Socket ports:bulk_update emitted for ${updatedPortsForSocket.length} ports`)
        } catch (socketError) {
          logger.error(`[TrafficConsumer] Erreur socket ports:bulk_update: ${socketError.message}`)
        }
        
        try { 
          SocketService.emitToAll('portEvents:created', { device_id: deviceId })
          logger.info(`[TrafficConsumer] Socket portEvents:created emitted for device_id=${deviceId}`)
        } catch (socketError) {
          logger.error(`[TrafficConsumer] Erreur socket portEvents:created: ${socketError.message}`)
        }
        
        logger.info(`[TrafficConsumer] Device ${deviceId} processed: ${portsArr.length} ports, sockets emitted`)
      } catch (e) {
        logger.error(`[TrafficConsumer] Error processing message: ${e.message}`)
        logger.error(`[TrafficConsumer] Message: ${JSON.stringify(trafficResult)}`)
      }
    })
  }
}

export default new PortService();

