import db from '../config/db.js';
import { locations } from '../models/location.model.js';
import { eq } from 'drizzle-orm';
import logger from '../logger/logger.js';

class LocationService {
  list = async () => {
    try {
      logger.info('Fetching all locations');
      const result = await db.select().from(locations);
      logger.info(`Fetched ${result.length} locations`);
      return result;
    } catch (error) {
      logger.error(`Error fetching locations: ${error.message}`);
      throw new Error('Database error while fetching locations');
    }
  }

  get = async (id) => {
    try {
      logger.info(`Fetching location id=${id}`);
      const result = await db.select().from(locations).where(eq(locations.id, id));
      if (result.length > 0) {
        logger.info(`Location found: ${JSON.stringify(result[0])}`);
      } else {
        logger.warn(`Location id=${id} not found`);
      }
      return result;
    } catch (error) {
      logger.error(`Error fetching location id=${id}: ${error.message}`);
      throw new Error('Database error while fetching location');
    }
  }

  create = async (data) => {
    try {
      logger.info(`Creating location name=${data.name}`);
      const result = await db.insert(locations).values(data);
      logger.info(`Location created with insertId=${result.insertId || 'unknown'}`);
      return result.insertId;
    } catch (error) {
      logger.error(`Error creating location: ${error.message}`);
      throw new Error('Database error while creating location');
    }
  }

  update = async (id, data) => {
    try {
      logger.info(`Updating location id=${id}`);
      const result = await db.update(locations).set(data).where(eq(locations.id, id));
      logger.info(`Update result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Error updating location id=${id}: ${error.message}`);
      throw new Error('Database error while updating location');
    }
  }

  delete = async (id) => {
    try {
      logger.info(`Deleting location id=${id}`);
      const result = await db.delete(locations).where(eq(locations.id, id));
      logger.info(`Delete result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting location id=${id}: ${error.message}`);
      throw new Error('Database error while deleting location');
    }
  }
}

export default new LocationService();
