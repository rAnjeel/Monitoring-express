const db = require('../config/db');
const { devices } = require('../models/device.model');
const { eq } = require('drizzle-orm');
const logger = require('../logger/logger');

class DeviceService {
  async list() {
    try {
      logger.info('Fetching all devices');
      return await db.select().from(devices);
    } catch (error) {
      logger.error(`Error fetching devices: ${error.message}`);
      throw new Error('Database error while fetching devices');
    }
  }

  async get(id) {
    try {
      logger.info(`Fetching device id=${id}`);
      return await db.select().from(devices).where(eq(devices.id, id));
    } catch (error) {
      logger.error(`Error fetching device id=${id}: ${error.message}`);
      throw new Error('Database error while fetching device');
    }
  }

  async create(data) {
    try {
      logger.info(`Creating device ip=${data.ip}`);
      const result = await db.insert(devices).values(data);
      return result.insertId;
    } catch (error) {
      logger.error(`Error creating device: ${error.message}`);
      throw new Error('Database error while creating device');
    }
  }

  async update(id, data) {
    try {
      logger.info(`Updating device id=${id}`);
      await db.update(devices).set(data).where(eq(devices.id, id));
    } catch (error) {
      logger.error(`Error updating device id=${id}: ${error.message}`);
      throw new Error('Database error while updating device');
    }
  }

  async delete(id) {
    try {
      logger.info(`Deleting device id=${id}`);
      await db.delete(devices).where(eq(devices.id, id));
    } catch (error) {
      logger.error(`Error deleting device id=${id}: ${error.message}`);
      throw new Error('Database error while deleting device');
    }
  }
}

module.exports = new DeviceService();
