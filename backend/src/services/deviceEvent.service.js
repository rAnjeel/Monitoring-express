import db from '../config/db.js';
import { deviceEvents } from '../models/deviceEvent.model.js';
import { devices } from '../models/device.model.js';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
import logger from '../logger/logger.js';
import DeviceEventDto from '../dto/deviceEvent.dto.js';

class DeviceEventService {
  // Créer un nouvel événement
  create = async (data) => {
    try {
      logger.info(`[DeviceEvent] Creating event for device_id=${data.device_id}, status=${data.status}`);
      
      const result = await db.insert(deviceEvents).values(data);
      logger.info(`[DeviceEvent] Event created with ID=${result.device_id}`);
      
      return result.device_id;
    } catch (error) {
      logger.error(`[DeviceEvent] Error creating event: ${error.message}`);
      throw new Error('Database error while creating device event');
    }
  };

  // Récupérer un événement par ID
  get = async (id) => {
    try {
      logger.info(`[DeviceEvent] Fetching event id=${id}`);
      
      const result = await db
        .select()
        .from(deviceEvents)
        .where(eq(deviceEvents.id, id));

      if (result.length === 0) {
        logger.warn(`[DeviceEvent] Event id=${id} not found`);
        return null;
      }

      logger.info(`[DeviceEvent] Event found: ${result[0].id}`);
      return DeviceEventDto.format(result[0]);
    } catch (error) {
      logger.error(`[DeviceEvent] Error fetching event id=${id}: ${error.message}`);
      throw new Error('Database error while fetching device event');
    }
  };

  // Récupérer tous les événements d'un device
  getByDeviceId = async (deviceId, { page = 1, pageSize = 20, status, start_date, end_date } = {}) => {
    try {
      logger.info(`[DeviceEvent] Fetching events for device_id=${deviceId}`);
      
      const offset = (page - 1) * pageSize;
      const conditions = [eq(deviceEvents.device_id, deviceId)];

      // Filtrer par statut si fourni
      if (status) {
        conditions.push(eq(deviceEvents.status, status));
      }

      // Filtrer par date si fournie
      if (start_date) {
        conditions.push(gte(deviceEvents.event_time, new Date(start_date)));
      }
      if (end_date) {
        conditions.push(lte(deviceEvents.event_time, new Date(end_date)));
      }

      // Requête pour les données
      const rows = await db
        .select()
        .from(deviceEvents)
        .where(and(...conditions))
        .orderBy(desc(deviceEvents.event_time))
        .limit(pageSize)
        .offset(offset);

      // Requête pour le count total
      const countResult = await db
        .select({ count: sql`count(*)`.as('count') })
        .from(deviceEvents)
        .where(and(...conditions));

      const totalCount = Number(countResult[0]?.count || 0);

      logger.info(`[DeviceEvent] Found ${rows.length} events for device_id=${deviceId}`);
      
      return {
        rows: rows.map(event => DeviceEventDto.format(event)),
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      logger.error(`[DeviceEvent] Error fetching events for device_id=${deviceId}: ${error.message}`);
      throw new Error('Database error while fetching device events');
    }
  };

  // Récupérer tous les événements avec pagination
  getAll = async ({ page = 1, pageSize = 20, device_id, status, start_date, end_date } = {}) => {
    try {
      logger.info('[DeviceEvent] Fetching all events with pagination');
      
      const offset = (page - 1) * pageSize;
      const conditions = [];

      // Filtres
      if (device_id) {
        conditions.push(eq(deviceEvents.device_id, device_id));
      }
      if (status) {
        conditions.push(eq(deviceEvents.status, status));
      }
      if (start_date) {
        conditions.push(gte(deviceEvents.event_time, new Date(start_date)));
      }
      if (end_date) {
        conditions.push(lte(deviceEvents.event_time, new Date(end_date)));
      }

      // Requête avec jointure pour récupérer les infos du device
      const baseQuery = db
        .select({
          id: deviceEvents.id,
          device_id: deviceEvents.device_id,
          device_hostname: devices.hostname,
          loss: deviceEvents.loss,
          avg: deviceEvents.avg,
          min: deviceEvents.min,
          max: deviceEvents.max,
          status: deviceEvents.status,
          event_time: deviceEvents.event_time,
        })
        .from(deviceEvents)
        .leftJoin(devices, eq(devices.id, deviceEvents.device_id));

      // Appliquer les conditions
      const query = conditions.length > 0 
        ? baseQuery.where(and(...conditions))
        : baseQuery;

      const rows = await query
        .orderBy(desc(deviceEvents.event_time))
        .limit(pageSize)
        .offset(offset);

      // Count total
      const countQuery = conditions.length > 0
        ? db.select({ count: sql`count(*)`.as('count') }).from(deviceEvents).where(and(...conditions))
        : db.select({ count: sql`count(*)`.as('count') }).from(deviceEvents);

      const countResult = await countQuery;
      const totalCount = Number(countResult[0]?.count || 0);

      logger.info(`[DeviceEvent] Found ${rows.length} events total`);
      
      return {
        rows,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      logger.error(`[DeviceEvent] Error fetching all events: ${error.message}`);
      throw new Error('Database error while fetching device events');
    }
  };

  // Mettre à jour un événement
  update = async (id, data) => {
    try {
      logger.info(`[DeviceEvent] Updating event id=${id}`);
      
      const result = await db
        .update(deviceEvents)
        .set(data)
        .where(eq(deviceEvents.id, id));

      logger.info(`[DeviceEvent] Event id=${id} updated successfully`);
      return result;
    } catch (error) {
      logger.error(`[DeviceEvent] Error updating event id=${id}: ${error.message}`);
      throw new Error('Database error while updating device event');
    }
  };

  // Supprimer un événement
  delete = async (id) => {
    try {
      logger.info(`[DeviceEvent] Deleting event id=${id}`);
      
      const result = await db
        .delete(deviceEvents)
        .where(eq(deviceEvents.id, id));

      logger.info(`[DeviceEvent] Event id=${id} deleted successfully`);
      return result;
    } catch (error) {
      logger.error(`[DeviceEvent] Error deleting event id=${id}: ${error.message}`);
      throw new Error('Database error while deleting device event');
    }
  };

  // Créer un événement automatiquement lors d'un changement de statut
  createStatusChangeEvent = async (deviceId, currentStatus, pingData) => {
    try {
      const eventData = {
        device_id: deviceId,
        loss: pingData.loss || null,
        avg: pingData.avg || 0,
        min: pingData.min || 0,
        max: pingData.max || 0,
        status: currentStatus ? 'up' : 'down',
        event_time: new Date()
      };

      return await this.create(eventData);
    } catch (error) {
      logger.error(`[DeviceEvent] Error creating status change event: ${error.message}`);
      throw error;
    }
  };

  // Récupérer les statistiques d'événements
  getStats = async (deviceId, days = 30) => {
    try {
      logger.info(`[DeviceEvent] Getting stats for device_id=${deviceId}, last ${days} days`);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await db
        .select({
          status: deviceEvents.status,
          count: sql`count(*)`.as('count'),
          avg_response_time: sql`avg(avg)`.as('avg_response_time')
        })
        .from(deviceEvents)
        .where(and(
          eq(deviceEvents.device_id, deviceId),
          gte(deviceEvents.event_time, startDate)
        ))
        .groupBy(deviceEvents.status);

      return stats;
    } catch (error) {
      logger.error(`[DeviceEvent] Error getting stats: ${error.message}`);
      throw new Error('Database error while getting device event stats');
    }
  };
}

export default new DeviceEventService();
