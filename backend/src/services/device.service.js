import {db, mysqlPool} from '../config/db.js';
import { devices } from '../models/device.model.js';
import { locations } from '../models/location.model.js';
import { typeDevices } from '../models/typeDevice.model.js';
import { eq, sql, like, or, and } from 'drizzle-orm';
import logger from '../logger/logger.js';
import utilService from './util.service.js';
import ConsumerService from './messaging/consumer.service.js';
import SocketService from './socket/socket.service.js';

class DeviceService {
  constructor() {
    this.ipToDeviceIdCache = new Map()
    this.ipCacheMaxSize = Number(process.env.IP_CACHE_MAX || 10000)
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

  getHostnamesAndIds = async () => {
    try {
      logger.info('[DeviceService] Fetching hostnames and ids');
      const result = await db
        .select({
          deviceId: devices.id,
          ip: devices.hostname
        })
        .from(devices);
      logger.info(`[DeviceService] Fetched ${result.length} hostnames and ids`);
      return result;
    } catch (error) {
      logger.error(`[DeviceService] Error fetching hostnames and ids: ${error.message}`);
      throw new Error('Database error while fetching hostnames and ids');
    }
  }

  getDevicesPage = async ({ page = 1, pageSize = 10, filter = {} } = {}) => {
    try {
      const offset = (page - 1) * pageSize

      const { conditions, needsTypeJoin, needsLocJoin } = this.buildDeviceFilter(filter)

      // Base query
      let baseQuery = db.select({
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
      }).from(devices)

      if (needsTypeJoin) baseQuery = baseQuery.leftJoin(typeDevices, eq(typeDevices.id, devices.type_device_id))
      baseQuery = baseQuery.leftJoin(locations, eq(locations.id, devices.location_id))

      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions))
      }

      const rowsPromise = baseQuery.limit(pageSize).offset(offset)

      // Count query with same joins/conditions
      let countQuery = db.select({ count: sql`count(*)`.as('count') }).from(devices)
      if (needsTypeJoin) countQuery = countQuery.leftJoin(typeDevices, eq(typeDevices.id, devices.type_device_id))
      countQuery = countQuery.leftJoin(locations, eq(locations.id, devices.location_id))
      if (conditions.length > 0) countQuery = countQuery.where(and(...conditions))

      const [rows, countResult] = await Promise.all([rowsPromise, countQuery])
      const totalCount = Number(countResult?.[0]?.count || 0)

      return { rows, totalCount }
    } catch (error) {
      logger.error(`[Devices] Pagination error: ${error.message}`)
      throw error
    }
  }

  buildDeviceFilter = (filter = {}) => {
    const conditions = []
    let needsTypeJoin = false
    let needsLocJoin = false

    for (const [key, value] of Object.entries(filter)) {
      if (!value) continue

      switch (key) {
        case 'key': {
          const s = `%${value}%`
          needsTypeJoin = true
          needsLocJoin = true
          conditions.push(
            or(
              like(devices.hostname, s),
              like(devices.sysName, s),
              like(typeDevices.name, s),
              like(locations.name, s),
              like(devices.codesite, s)
            )
          )
          break
        }
        case 'type_device': {
          const s = `%${value}%`
          needsTypeJoin = true
          conditions.push(like(typeDevices.name, s))
          break
        }
        case 'location': {
          const s = `%${value}%`
          needsLocJoin = true
          conditions.push(like(locations.name, s))
          break
        }
        case 'hostname': {
          const s = `%${value}%`
          conditions.push(like(devices.hostname, s))
          break
        }
        case 'sysName': {
          const s = `%${value}%`
          conditions.push(like(devices.sysName, s))
          break
        }
        default:
          break
      }
    }

    return { conditions, needsTypeJoin, needsLocJoin }
  }


  startPingConsumer = async () => {
    const queueName = process.env.RABBIT_QUEUE_PING || 'ping_results'
    const consumer = new ConsumerService(queueName)

    await consumer.start(async (pingResult) => {
      try {
        const { lossPct, avg, min, max, deviceId, ip } = pingResult
        const nowDate = new Date()

        if (process.env.NODE_ENV === 'development') {
          logger.info(`[PingConsumer] Message reçu: deviceId=${deviceId}, ip=${ip}, loss=${lossPct}%`)
        }

        const lossThreshold = parseFloat(process.env.PING_LOSS_THRESHOLD || 10)
        const isUp = lossPct <= lossThreshold
        const status = isUp ? 'up' : 'down'

        const updateSql = isUp
          ? 'UPDATE devices SET ping_status = ?, loss = ?, avg = ?, min = ?, max = ?, uptime = ? WHERE id = ?'
          : 'UPDATE devices SET ping_status = ?, loss = ?, avg = ?, min = ?, max = ? WHERE id = ?'
        const updateParams = isUp
          ? [
              isUp ? 1 : 0,
              lossPct,
              avg,
              min,
              max,
              nowDate.toISOString().slice(0, 19).replace('T', ' '),
              deviceId,
            ]
          : [
              isUp ? 1 : 0,
              lossPct,
              avg,
              min,
              max,
              deviceId,
            ]

      await Promise.all([
        mysqlPool.execute(updateSql, updateParams),
          mysqlPool.execute(
            'INSERT INTO device_events (device_id, loss, avg, min, max, status, event_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [deviceId, lossPct, avg, min, max, status, nowDate.toISOString().slice(0, 19).replace('T', ' ')]
          )
        ])

        // Notifier le front une fois les écritures terminées
        try {
          SocketService.emitToAll('devices:bulk_update', [])
        } catch {}
        try {
          SocketService.emitToAll('deviceEvents:created', { device_id: deviceId })
        } catch {}

        if (process.env.NODE_ENV === 'development') {
          logger.info(`[PingConsumer] Device ${deviceId} mis à jour avec succès - Status: ${status}`)
        }
      } catch (error) {
        logger.error(`[PingConsumer] Erreur traitement message: ${error.message}`)
        try { logger.error(`[PingConsumer] Message: ${JSON.stringify(pingResult)}`) } catch {}
      }
    })
  }
}

export default new DeviceService();
