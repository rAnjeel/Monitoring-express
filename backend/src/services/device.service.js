const db = require('../config/db');
const { devices } = require('../models/device.model');
const { locations } = require('../models/location.model');
const { typeDevices } = require('../models/typeDevice.model');
const { eq } = require('drizzle-orm');
const logger = require('../logger/logger');

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
    logger.info('Received data for CSV import:', data); 
  }

  async getFullList() {
    try {
      const rows = await db
        .select({
          device_id: devices.device_id,
          id: devices.id,
          hostname: devices.hostname,
          status: devices.status,
          codesite: devices.codesite,
          loss: devices.loss,
          avg: devices.avg,
          min: devices.min,
          max: devices.max,
          uptime: devices.uptime,
          snmp_enabled: devices.snmp_enabled,
          community: devices.community,
          authlevel: devices.authlevel,
          authname: devices.authname,
          authpass: devices.authpass,
          authalgo: devices.authalgo,
          cryptopass: devices.cryptopass,
          cryptoalgo: devices.cryptoalgo,
          snmpver: devices.snmpver,
          ne_id: devices.ne_id,
          type_name: typeDevices.name,
          location_name: locations.name,
        })
        .from(devices)
        .leftJoin(typeDevices, eq(typeDevices.id, devices.type_id))
        .leftJoin(locations, eq(locations.id, devices.location_id));
      return rows;
    } catch (error) {
      logger.error(`Error fetching devices with names (drizzle): ${error.message}`);
      throw error;
    }
  }

}

module.exports = new DeviceService();
