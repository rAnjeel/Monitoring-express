const db = require('../config/db');
const { typeDevices } = require('../models/typeDevice.model');
const { eq } = require('drizzle-orm');
const logger = require('../logger/logger');

class TypeDeviceService {
  async list() {
    try {
      logger.info('Fetching all type_devices');
      const result = await db.select().from(typeDevices);
      logger.info(`Fetched ${result.length} type_devices`);
      return result;
    } catch (error) {
      logger.error(`Error fetching type_devices: ${error.message}`);
      throw new Error('Database error while fetching type_devices');
    }
  }

  async get(id) {
    try {
      logger.info(`Fetching type_device id=${id}`);
      const result = await db.select().from(typeDevices).where(eq(typeDevices.id, id));
      if (result.length > 0) {
        logger.info(`TypeDevice found: ${JSON.stringify(result[0])}`);
      } else {
        logger.warn(`TypeDevice id=${id} not found`);
      }
      return result;
    } catch (error) {
      logger.error(`Error fetching type_device id=${id}: ${error.message}`);
      throw new Error('Database error while fetching type_device');
    }
  }

  async create(data) {
    try {
      logger.info(`Creating type_device name=${data.name}`);
      const result = await db.insert(typeDevices).values(data);
      logger.info(`TypeDevice created with insertId=${result.insertId || 'unknown'}`);
      return result.insertId;
    } catch (error) {
      logger.error(`Error creating type_device: ${error.message}`);
      throw new Error('Database error while creating type_device');
    }
  }

  async update(id, data) {
    try {
      logger.info(`Updating type_device id=${id}`);
      const result = await db.update(typeDevices).set(data).where(eq(typeDevices.id, id));
      logger.info(`Update result for type_device id=${id}: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Error updating type_device id=${id}: ${error.message}`);
      throw new Error('Database error while updating type_device');
    }
  }

  async delete(id) {
    try {
      logger.info(`Deleting type_device id=${id}`);
      const result = await db.delete(typeDevices).where(eq(typeDevices.id, id));
      logger.info(`Delete result for type_device id=${id}: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting type_device id=${id}: ${error.message}`);
      throw new Error('Database error while deleting type_device');
    }
  }
}

module.exports = new TypeDeviceService();
