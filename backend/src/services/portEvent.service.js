import { portEvents } from '../models/portEvent.model.js';
import db from '../config/db.js';
import { eq, sql, and, desc, gte, lte, between } from 'drizzle-orm';
import logger from '../logger/logger.js';

class PortEventService {
  create = async (data) => {
    try {
      const result = await db.insert(portEvents).values(data);
      return result.insertId;
    } catch (error) {
      logger.error(`[PortEvent] Error creating: ${error.message}`);
      throw error;
    }
  }

  get = async (id) => {
    try {
      const rows = await db.select().from(portEvents).where(eq(portEvents.id, id));
      return rows?.[0] || null;
    } catch (error) {
      logger.error(`[PortEvent] Error fetching id=${id}: ${error.message}`);
      throw error;
    }
  }

  getByPortId = async (portId, { page = 1, pageSize = 20, status, start_date, end_date } = {}) => {
    try {
      const offset = (page - 1) * pageSize;
      const conds = [eq(portEvents.port_id, portId)];

      if (status) conds.push(eq(portEvents.status, status));
      if (start_date && end_date) {
        conds.push(between(portEvents.event_time, new Date(start_date), new Date(end_date)));
      } else if (start_date) {
        conds.push(gte(portEvents.event_time, new Date(start_date)));
      } else if (end_date) {
        conds.push(lte(portEvents.event_time, new Date(end_date)));
      }

      const rows = await db
        .select()
        .from(portEvents)
        .where(and(...conds))
        .orderBy(desc(portEvents.event_time))
        .limit(Number(pageSize) + 1)
        .offset(Number(offset));

      const hasNextPage = rows.length > pageSize;
      if (hasNextPage) rows.pop();

      return { rows, page, pageSize, hasNextPage };
    } catch (error) {
      logger.error(`[PortEvent] Error fetching by portId=${portId}: ${error.message}`);
      throw error;
    }
  }

  update = async (id, data) => {
    try {
      const result = await db.update(portEvents).set(data).where(eq(portEvents.id, id));
      return result;
    } catch (error) {
      logger.error(`[PortEvent] Error updating id=${id}: ${error.message}`);
      throw error;
    }
  }

  delete = async (id) => {
    try {
      const result = await db.delete(portEvents).where(eq(portEvents.id, id));
      return result;
    } catch (error) {
      logger.error(`[PortEvent] Error deleting id=${id}: ${error.message}`);
      throw error;
    }
  }
}

export default new PortEventService();
import { portEvents } from '../models/portEvent.model.js';
