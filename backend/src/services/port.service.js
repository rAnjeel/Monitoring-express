const db = require('../config/db');
const { ports } = require('../models/port.model');
const { eq } = require('drizzle-orm');
const logger = require('../logger/logger');

class PortService {
  async list() {
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

  async get(id) {
    try {
      logger.info(`Fetching port id=${id}`);
      const result = await db.select().from(ports).where(eq(ports.id, id));
      return result;
    } catch (error) {
      logger.error(`Error fetching port id=${id}: ${error.message}`);
      throw new Error('Database error while fetching port');
    }
  }

  async create(data) {
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

  async update(id, data) {
    try {
      logger.info(`Updating port id=${id}`);
      const result = await db.update(ports).set(data).where(eq(ports.id, id));
      return result;
    } catch (error) {
      logger.error(`Error updating port id=${id}: ${error.message}`);
      throw new Error('Database error while updating port');
    }
  }

  async delete(id) {
    try {
      logger.info(`Deleting port id=${id}`);
      const result = await db.delete(ports).where(eq(ports.id, id));
      return result;
    } catch (error) {
      logger.error(`Error deleting port id=${id}: ${error.message}`);
      throw new Error('Database error while deleting port');
    }
  }
}

module.exports = new PortService();

