const db = require('../config/db');
const { devices } = require('../models/device.model');
const { locations } = require('../models/location.model');
const { typeDevices } = require('../models/typeDevice.model');
const { eq } = require('drizzle-orm');
const logger = require('../logger/logger');
const DeviceDTO = require('../dto/device.dto');

class DeviceService {
  async list() {
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

  async get(id) {
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

  async create(data) {
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

  async update(id, data) {
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

  async delete(id) {
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

  async importDataCSV(data) {
    if (!Array.isArray(data)) {
      logger.warn('importDataCSV received non-array payload');
      return { data: [], count: 0 };
    }

    const toNull = (v) => {
      if (v === undefined || v === null) return null;
      const s = typeof v === 'string' ? v.trim() : v;
      if (s === '' || s === '\\N' || s === '\\n' || s === 'NULL' || s === 'null') return null;
      return s;
    };
    const toIntOrNull = (v) => {
      const x = toNull(v);
      if (x === null) return null;
      const n = Number(x);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    };
    const toFloatOrNull = (v) => {
      const x = toNull(v);
      if (x === null) return null;
      const n = Number(x);
      return Number.isFinite(n) ? n : null;
    };
    const toSnmpDisabled = (v) => {
      const x = toNull(v);
      if (x === null) return 0; // default 0 as in example
      if (typeof x === 'boolean') return x ? 1 : 0;
      if (x === '1' || x === 1 || x === 'true') return 1;
      if (x === '0' || x === 0 || x === 'false') return 0;
      return 0;
    };

    const transformed = data.map((row, index) => {
      try {
        logger.info(`CSV row ${index + 1}: ${JSON.stringify(row)}`);
      } catch {
        logger.warn(`CSV row ${index + 1}: [unserializable row]`);
      }

      const dto = new DeviceDTO({
        device_id: toIntOrNull(row.device_id),
        ip: toNull(row.ip),
        hostname: toNull(row.hostname),
        status: toIntOrNull(row.status),
        type_device_id: toIntOrNull(row.type_device_id ?? row.type_id),
        location_id: toIntOrNull(row.location_id),
        codesite: toNull(row.codesite),
        loss: toFloatOrNull(row.loss),
        avg: toFloatOrNull(row.avg),
        min: toFloatOrNull(row.min),
        max: toFloatOrNull(row.max),
        uptime: toNull(row.uptime),
        snmp_disabled: toSnmpDisabled(row.snmp_disabled ?? row.snmp_disable ?? (row.snmp_enabled !== undefined ? (!row.snmp_enabled ? 1 : 0) : null)),
        community: toNull(row.community),
        authlevel: toNull(row.authlevel),
        authname: toNull(row.authname),
        authpass: toNull(row.authpass),
        authalgo: toNull(row.authalgo),
        cryptopass: toNull(row.cryptopass),
        cryptoalgo: toNull(row.cryptoalgo),
        snmpver: toNull(row.snmpver),
        ne_id: toIntOrNull(row.ne_id),
      });

      return dto;
    });
    logger.info(`Transformed payload for import: ${JSON.stringify(transformed)}`);

    // Helper to convert uptime string/number into Date or null
    const toDateOrNull = (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (value instanceof Date) return value;
      const n = Number(value);
      if (!Number.isNaN(n) && Number.isFinite(n)) {
        const millis = String(Math.trunc(n)).length === 10 ? n * 1000 : n;
        const d = new Date(millis);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      const parsed = Date.parse(String(value));
      return Number.isNaN(parsed) ? null : new Date(parsed);
    };

    // Create or update each transformed DTO
    let createdOrUpdated = 0;
    const errors = [];
    for (const dto of transformed) {
      const row = {
        device_id: dto.device_id,
        // id omitted for AUTO_INCREMENT
        ip: dto.ip,
        hostname: dto.hostname,
        status: dto.status,
        type_id: dto.type_device_id,
        location_id: dto.location_id,
        codesite: dto.codesite,
        loss: dto.loss,
        avg: dto.avg,
        min: dto.min,
        max: dto.max,
        uptime: toDateOrNull(dto.uptime),
        snmp_enabled: dto.snmp_disabled === 1 ? false : true,
        community: dto.community,
        authlevel: dto.authlevel,
        authname: dto.authname,
        authpass: dto.authpass,
        authalgo: dto.authalgo,
        cryptopass: dto.cryptopass,
        cryptoalgo: dto.cryptoalgo,
        snmpver: dto.snmpver,
        ne_id: dto.ne_id,
      };

      try {
        await db
          .insert(devices)
          .values(row)
          .onDuplicateKeyUpdate({
            set: {
              ip: row.ip,
              hostname: row.hostname,
              status: row.status,
              type_id: row.type_id,
              location_id: row.location_id,
              codesite: row.codesite,
              loss: row.loss,
              avg: row.avg,
              min: row.min,
              max: row.max,
              uptime: row.uptime,
              snmp_enabled: row.snmp_enabled,
              community: row.community,
              authlevel: row.authlevel,
              authname: row.authname,
              authpass: row.authpass,
              authalgo: row.authalgo,
              cryptopass: row.cryptopass,
              cryptoalgo: row.cryptoalgo,
              snmpver: row.snmpver,
              ne_id: row.ne_id,
            },
          });
        logger.info(`Created/updated device_id=${row.device_id} hostname=${row.hostname}`);
        createdOrUpdated += 1;
      } catch (e) {
        logger.error(`Insert/upsert failed for device_id=${row.device_id}: ${e.message}`);
        errors.push({ device_id: row.device_id, error: e.message });
      }
    }

    return { data: transformed, count: transformed.length, createdOrUpdated, errors };
  }

  async getFullList() {
    try {
      const rows = await db
        .select({
          device_id: devices.device_id,
          id: devices.id,
          hostname: devices.hostname,
          type_device: typeDevices.name,
          location: locations.name,
          status: devices.status,
          codesite: devices.codesite,
          loss: devices.loss,
          avg: devices.avg,
          min: devices.min,
          max: devices.max,
          uptime: devices.uptime,
          snmp_disabled: devices.snmp_disabled,
          community: devices.community,
          authlevel: devices.authlevel,
          authname: devices.authname,
          authpass: devices.authpass,
          authalgo: devices.authalgo,
          cryptopass: devices.cryptopass,
          cryptoalgo: devices.cryptoalgo,
          snmpver: devices.snmpver,
          ne_id: devices.ne_id,
        })
        .from(devices)
        .leftJoin(typeDevices, eq(typeDevices.id, devices.type_device_id))
        .leftJoin(locations, eq(locations.id, devices.location_id));
      return rows;
    } catch (error) {
      logger.error(`Error fetching devices with names (drizzle): ${error.message}`);
      throw error;
    }
  }

}

module.exports = new DeviceService();
