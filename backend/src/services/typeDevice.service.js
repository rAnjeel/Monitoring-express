const db = require('../config/db');
const { typeDevices } = require('../models/typeDevice.model');
const { eq } = require('drizzle-orm');
const logger = require('../logger/logger');

class TypeDeviceService {
  async list() {
    try {
      logger.info('Fetching all type_devices');
      return await db.select().from(typeDevices);
    } catch (error) {
      logger.error(`Error fetching type_devices: ${error.message}`);
      throw new Error('Database error while fetching type_devices');
    }
  }

  async get(id) {
    try {
      logger.info(`Fetching type_device id=${id}`);
      return await db.select().from(typeDevices).where(eq(typeDevices.id, id));
    } catch (error) {
      logger.error(`Error fetching type_device id=${id}: ${error.message}`);
      throw new Error('Database error while fetching type_device');
    }
  }

  async create(data) {
    try {
      logger.info(`Creating type_device name=${data.name}`);
      const result = await db.insert(typeDevices).values(data);
      return result.insertId;
    } catch (error) {
      logger.error(`Error creating type_device: ${error.message}`);
      throw new Error('Database error while creating type_device');
    }
  }

  async update(id, data) {
    try {
      logger.info(`Updating type_device id=${id}`);
      await db.update(typeDevices).set(data).where(eq(typeDevices.id, id));
    } catch (error) {
      logger.error(`Error updating type_device id=${id}: ${error.message}`);
      throw new Error('Database error while updating type_device');
    }
  }

  async delete(id) {
    try {
      logger.info(`Deleting type_device id=${id}`);
      await db.delete(typeDevices).where(eq(typeDevices.id, id));
    } catch (error) {
      logger.error(`Error deleting type_device id=${id}: ${error.message}`);
      throw new Error('Database error while deleting type_device');
    }
  }
}

module.exports = new TypeDeviceService();
