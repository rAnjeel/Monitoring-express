const db = require('../config/db');
const { devices } = require('../models/device.model');
const { locations } = require('../models/location.model');
const { typeDevices } = require('../models/typeDevice.model');
const { eq, sql, like, or, and } = require('drizzle-orm');
const logger = require('../logger/logger');
const utilService = require('./util.service');

class DeviceService {
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


  getDevicesPage = async ({ page = 1, pageSize = 20 } = {}) => {
    try {
      const offset = (page - 1) * pageSize;

      // Requête paginée
      const rows = await db
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
        .leftJoin(locations, eq(locations.id, devices.location_id))
        .limit(pageSize)
        .offset(offset);
      
        const totalCountResult = await db.execute(sql`SELECT count(*) AS count FROM devices`);
        const totalCountRes = totalCountResult[0];
      return { rows, totalCountRes}
    } catch (error) {
      logger.error(`Error fetching paginated devices (drizzle): ${error.message}`);
      throw error;
    }
  }
}

module.exports = new DeviceService();
