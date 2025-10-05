import db from '../config/db.js';
import { typeDevices } from '../models/typeDevice.model.js';
import { devices } from '../models/device.model.js';
import { eq, sql } from 'drizzle-orm';
import logger from '../logger/logger.js';

class TypeDeviceService {
  list = async () => {
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

  get = async (id) => {
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

  create = async (data) => {
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

  update = async (id, data) => {
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

  delete = async (id) => {
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

  // Retourne, pour chaque type_device, le total de devices et le total DOWN (ping_status = 0)
  getTypeDeviceCounts = async () => {
    try {
      logger.info('Fetching device counts per type_device (total and down)');

      const rows = await db
        .select({
          type_device_id: typeDevices.id,
          type_device: typeDevices.name,
          total_devices: sql`COUNT(${devices.id})`,
          down_devices: sql`SUM(CASE WHEN ${devices.ping_status} = 0 THEN 1 ELSE 0 END)`,
        })
        .from(typeDevices)
        .leftJoin(devices, eq(devices.type_device_id, typeDevices.id))
        .groupBy(typeDevices.id, typeDevices.name);

      logger.info(`Fetched counts for ${rows.length} type_devices`);
      return rows;
    } catch (error) {
      logger.error(`Error fetching counts per type_device: ${error.message}`);
      throw new Error('Database error while fetching counts per type_device');
    }
  }
}

export default new TypeDeviceService();
