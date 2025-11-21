import { db } from '../config/db.js';
import { monitoringSettings } from '../models/monitoringSetting.model.js';
import { eq, sql } from 'drizzle-orm';
import logger from '../logger/logger.js';

class MonitoringSettingService {
  mapRow = (r) => ({
    id: r.id,
    key: r.setting_key,
    value: r.setting_value,
    type: r.type,
    description: r.description,
    inserted_date: r.inserted_date,
  })

  toDbPayload = (data) => {
    const payload = {}
    if (data == null || typeof data !== 'object') return payload
    if (data.key != null) payload.setting_key = data.key
    if (data.value != null) payload.setting_value = data.value
    if (data.setting_key != null) payload.setting_key = data.setting_key
    if (data.setting_value != null) payload.setting_value = data.setting_value
    if (data.type != null) payload.type = data.type
    if (data.description != null) payload.description = data.description
    return payload
  }

  list = async () => {
    try {
      logger.info('Fetching all monitoring settings');
      const result = await db.select().from(monitoringSettings);
      logger.info(`Fetched ${result.length} monitoring settings`);
      return result.map(this.mapRow);
    } catch (error) {
      logger.error(`Error fetching monitoring settings: ${error.message}`);
      throw new Error('Database error while fetching monitoring settings');
    }
  }

  get = async (id) => {
    try {
      logger.info(`Fetching monitoring setting id=${id}`);
      const result = await db.select().from(monitoringSettings).where(eq(monitoringSettings.id, id));
      return result.map(this.mapRow);
    } catch (error) {
      logger.error(`Error fetching monitoring setting id=${id}: ${error.message}`);
      throw new Error('Database error while fetching monitoring setting');
    }
  }

  getByKeyName = async (keyName) => {
    try {
      logger.info(`Fetching monitoring setting by key=${keyName}`);
      const result = await db
        .select()
        .from(monitoringSettings)
        .where(eq(monitoringSettings.setting_key, keyName));
      return result.map(this.mapRow);
    } catch (error) {
      logger.error(`Error fetching monitoring setting by key=${keyName}: ${error.message}`);
      throw new Error('Database error while fetching monitoring setting by key');
    }
  }

  create = async (data) => {
    try {
      const payload = this.toDbPayload(data)
      logger.info(`Creating monitoring setting key=${payload.setting_key}`);
      const result = await db.insert(monitoringSettings).values(payload);
      return result.insertId;
    } catch (error) {
      logger.error(`Error creating monitoring setting: ${error.message}`);
      throw new Error('Database error while creating monitoring setting');
    }
  }

  update = async (id, data) => {
    try {
      logger.info(`Updating monitoring setting id=${id}`);
      const payload = this.toDbPayload(data)
      const result = await db
        .update(monitoringSettings)
        .set({
          ...payload,
          inserted_date: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(monitoringSettings.id, id));
      return result;
    } catch (error) {
      logger.error(`Error updating monitoring setting id=${id}: ${error.message}`);
      throw new Error('Database error while updating monitoring setting');
    }
  }

  delete = async (id) => {
    try {
      logger.info(`Deleting monitoring setting id=${id}`);
      const result = await db.delete(monitoringSettings).where(eq(monitoringSettings.id, id));
      return result;
    } catch (error) {
      logger.error(`Error deleting monitoring setting id=${id}: ${error.message}`);
      throw new Error('Database error while deleting monitoring setting');
    }
  }
}

const monitoringSettingService = new MonitoringSettingService();
export default monitoringSettingService;
