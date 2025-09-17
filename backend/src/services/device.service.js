const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');
const { devices } = require('../models/device.model');
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
    try {
      const results = [];

      for (const row of data) {
        const device = {
          id: row.id && row.id !== '\\N' ? parseInt(row.id, 10) : null,
          ip: row.ip && row.ip !== '\\N' ? row.ip : null,
          hostname: row.hostname && row.hostname !== '\\N' ? row.hostname : null,
          status: row.status ? parseInt(row.status, 10) : null,
          type_id: row.type_device_id ? parseInt(row.type_device_id, 10) : null,
          location_id: row.location_id ? parseInt(row.location_id, 10) : null,
          codesite: row.codesite && row.codesite !== '\\N' ? row.codesite : null,
          loss: row.loss ? parseFloat(row.loss) : null,
          avg: row.avg ? parseFloat(row.avg) : null,
          min: row.min ? parseFloat(row.min) : null,
          max: row.max ? parseFloat(row.max) : null,
          uptime: row.uptime && row.uptime !== '\\N' ? new Date(row.uptime) : null,
          snmp_enabled: row.snmp_disable === '0' ? true : false,
          community: row.community && row.community !== '\\N' ? row.community : null,
          authlevel: row.authlevel && row.authlevel !== '\\N' ? row.authlevel : null,
          authname: row.authname && row.authname !== '\\N' ? row.authname : null,
          authpass: row.authpass && row.authpass !== '\\N' ? row.authpass : null,
          authalgo: row.authalgo && row.authalgo !== '\\N' ? row.authalgo : null,
          cryptopass: row.cryptopass && row.cryptopass !== '\\N' ? row.cryptopass : null,
          cryptoalgo: row.cryptoalgo && row.cryptoalgo !== '\\N' ? row.cryptoalgo : null,
          snmpver: row.snmpver && row.snmpver !== '\\N' ? row.snmpver : null,
          ne_id: row.ne_id && row.ne_id !== '\\N' ? row.ne_id : null,
        };

        results.push(device);

        await db.insert(devices).values(device);
        logger.info(`Inserted device ip=${device.ip} hostname=${device.hostname}`);
      }

      logger.info(`Successfully imported ${results.length} devices`);
      return results.length;
    } catch (err) {
      logger.error(`Database error during import: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new DeviceService();
