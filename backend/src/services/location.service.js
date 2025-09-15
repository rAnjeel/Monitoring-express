const db = require('../config/db');
const { locations } = require('../models/location.model');
const { eq } = require('drizzle-orm');
const logger = require('../logger/logger');

class LocationService {
  async list() {
    try {
      logger.info('Fetching all locations');
      return await db.select().from(locations);
    } catch (error) {
      logger.error(`Error fetching locations: ${error.message}`);
      throw new Error('Database error while fetching locations');
    }
  }

  async get(id) {
    try {
      logger.info(`Fetching location id=${id}`);
      return await db.select().from(locations).where(eq(locations.id, id));
    } catch (error) {
      logger.error(`Error fetching location id=${id}: ${error.message}`);
      throw new Error('Database error while fetching location');
    }
  }

  async create(data) {
    try {
      logger.info(`Creating location name=${data.name}`);
      const result = await db.insert(locations).values(data);
      return result.insertId;
    } catch (error) {
      logger.error(`Error creating location: ${error.message}`);
      throw new Error('Database error while creating location');
    }
  }

  async update(id, data) {
    try {
      logger.info(`Updating location id=${id}`);
      await db.update(locations).set(data).where(eq(locations.id, id));
    } catch (error) {
      logger.error(`Error updating location id=${id}: ${error.message}`);
      throw new Error('Database error while updating location');
    }
  }

  async delete(id) {
    try {
      logger.info(`Deleting location id=${id}`);
      await db.delete(locations).where(eq(locations.id, id));
    } catch (error) {
      logger.error(`Error deleting location id=${id}: ${error.message}`);
      throw new Error('Database error while deleting location');
    }
  }
}

module.exports = new LocationService();
