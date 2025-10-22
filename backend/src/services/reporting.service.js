import { mysqlPool } from '../config/db.js';
import logger from '../logger/logger.js';

class ReportingService {

  // Reporting MySQL: tous les événements pour toutes les devices entre 2 dates (ORDER BY DESC), sans pagination
  reportAllDevicesByDateRange = async ({ start_date, end_date, status, device_id, type_device } = {}) => {
    try {
      if (!start_date || !end_date) {
        throw new Error('start_date and end_date are required')
      }

      const whereClauses = ['de.event_time BETWEEN ? AND ?']
      const params = [new Date(start_date), new Date(end_date)]

      if (status) {
        whereClauses.push('de.status = ?')
        params.push(status)
      }

      if (device_id) {
        whereClauses.push('de.device_id = ?')
        params.push(Number(device_id))
      }

      if (type_device) {
        whereClauses.push('d.type_device_id = ?')
        params.push(type_device)
      }

      const sqlQuery = `
        SELECT
          de.id,
          de.device_id,
          d.hostname AS device_hostname,
          de.loss,
          de.avg,
          de.min,
          de.max,
          de.status,
          de.event_time
        FROM device_events de
        LEFT JOIN devices d ON d.id = de.device_id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY de.event_time DESC
      `

      const [rows] = await mysqlPool.execute(sqlQuery, params)
      return rows
    } catch (error) {
      logger.error(`[Device] Error (MySQL) reporting all devices between dates: ${error.message}`)
      throw new Error('Database error while reporting all devices events (mysql)')
    }
  };
    
  // Top 10 des équipements les plus instables (30 derniers jours)
  getTop10UnstableDevices = async ({ type_device } = {}) => {
    try {
      logger.info('[ReportingService] Fetching top 10 unstable devices');
      
      const sqlQuery = `
        SELECT 
          d.hostname,
          COUNT(*) AS total_events,
          SUM(CASE WHEN e.status = 'down' THEN 1 ELSE 0 END) AS nb_down,
          ROUND(SUM(CASE WHEN e.status = 'down' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS taux_panne
        FROM device_events e
        JOIN devices d ON d.id = e.device_id
        WHERE e.event_time >= CURDATE() - INTERVAL 30 DAY
        ${type_device ? `AND d.type_device_id = ?` : ''}
        GROUP BY d.hostname
        ${type_device ? `ORDER BY taux_panne DESC LIMIT 10` : ''}
      `;

      const [rows] = await mysqlPool.execute(sqlQuery, type_device ? [type_device] : undefined);
      logger.info(`[ReportingService] Found ${rows.length} unstable devices`);
      return rows;
    } catch (error) {
      logger.error(`[ReportingService] Error fetching top 10 unstable devices: ${error.message}`);
      throw new Error('Database error while fetching top 10 unstable devices');
    }
  };

  // Latence moyenne par jour et par codesite
  getAverageLatencyByDayAndSite = async ({ start_date, end_date, type_device, device_id } = {}) => {
    try {
      logger.info('[ReportingService] Fetching average latency by day and site');
      
      const whereClauses = []
      const params = []

      if (start_date && end_date) {
        whereClauses.push('e.event_time BETWEEN ? AND ?')
        params.push(new Date(start_date), new Date(end_date))
      }

      if (type_device) {
        whereClauses.push('d.type_device_id = ?')
        params.push(type_device)
      }

      if (device_id) {
        whereClauses.push('d.id = ?')
        params.push(device_id)
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
      
      const sqlQuery = `
        SELECT 
          DATE(e.event_time) AS jour,
          d.hostname,
          ROUND(AVG(e.avg), 2) AS avg_latency_ms,
          ROUND(MIN(e.min), 2) AS min_latency_ms,
          ROUND(MAX(e.max), 2) AS max_latency_ms,
          ROUND(AVG(e.max - e.min), 2) AS jitter_ms,
          ROUND(SUM(CASE WHEN e.status = 'up' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS availability_percent
        FROM device_events e
        JOIN devices d ON d.id = e.device_id
        ${whereClause}
        GROUP BY jour, d.hostname
        ORDER BY jour DESC
      `;

      const [rows] = await mysqlPool.execute(sqlQuery, params.length > 0 ? params : undefined);
      logger.info(`[ReportingService] Found ${rows.length} latency records`);
      return rows;
    } catch (error) {
      logger.error(`[ReportingService] Error fetching average latency by day and site: ${error.message}`);
      throw new Error('Database error while fetching average latency by day and site');
    }
  };

  getDeviceStabilityStatus = async ({ start_date, end_date, type_device } = {}) => {
    try {
      logger.info('[ReportingService] Calculating current stability state for all devices');

      // Période par défaut : 30 derniers jours
      const start = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = end_date ? new Date(end_date) : new Date();

      const whereClauses = ['e.event_time BETWEEN ? AND ?'];
      const params = [start, end];

      if (type_device) {
        whereClauses.push('d.type_device_id = ?');
        params.push(type_device);
      }

      const sqlQuery = `
        SELECT 
          d.hostname,
          d.sysName,
          d.type_device_id,
          COUNT(*) AS total_events,
          SUM(CASE WHEN e.status = 'down' THEN 1 ELSE 0 END) AS nb_down,
          ROUND(SUM(CASE WHEN e.status = 'down' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS taux_panne,
          CASE
            WHEN ROUND(SUM(e.status = 'down')/COUNT(*)*100,2) > 5 THEN 'Instable'
            WHEN ROUND(SUM(e.status = 'down')/COUNT(*)*100,2) BETWEEN 2 AND 5 THEN 'À surveiller'
            ELSE 'Stable'
          END AS etat_stabilite
        FROM device_events e
        JOIN devices d ON d.id = e.device_id
        WHERE ${whereClauses.join(' AND ')}
        GROUP BY d.hostname, d.type_device_id
        ORDER BY taux_panne DESC
      `;

      const [rows] = await mysqlPool.execute(sqlQuery, params);

      logger.info(`[ReportingService] Calculated stability state for ${rows.length} devices`);
      return rows;
    } catch (error) {
      logger.error(`[ReportingService] Error calculating device stability: ${error.message}`);
      throw new Error('Database error while calculating device stability');
    }
  };

  // MTTR - Mean Time To Recovery (Temps moyen de récupération)
  getMTTR = async ({ device_id } = {}) => {
    try {
      logger.info('[ReportingService] Calculating MTTR for device');
      
      if (!device_id) {
        throw new Error('device_id is required for MTTR calculation');
      }

      const sqlQuery = `
        SELECT 
          device_id,
          ROUND(AVG(TIMESTAMPDIFF(MINUTE, event_time, next_up_time)) / 60, 2) AS MTTR_hours
        FROM (
          SELECT 
            e.device_id,
            e.event_time,
            LEAD(e.event_time) OVER (PARTITION BY e.device_id ORDER BY e.event_time) AS next_up_time
          FROM device_events e
          WHERE e.status = 'down' AND e.device_id = ?
        ) t
        WHERE next_up_time IS NOT NULL
        GROUP BY device_id
      `;

      const [rows] = await mysqlPool.execute(sqlQuery, [device_id]);
      logger.info(`[ReportingService] MTTR calculated for device ${device_id}`);
      return rows;
    } catch (error) {
      logger.error(`[ReportingService] Error calculating MTTR: ${error.message}`);
      throw new Error('Database error while calculating MTTR');
    }
  };

  // MTBF - Mean Time Between Failures (Temps moyen entre pannes)
  getMTBF = async ({ device_id } = {}) => {
    try {
      logger.info('[ReportingService] Calculating MTBF for device');
      
      if (!device_id) {
        throw new Error('device_id is required for MTBF calculation');
      }

      const sqlQuery = `
        SELECT 
          device_id,
          ROUND(AVG(TIMESTAMPDIFF(MINUTE, last_down_time, next_down_time)) / 60, 2) AS MTBF_hours
        FROM (
          SELECT 
            e.device_id,
            e.event_time AS last_down_time,
            LEAD(e.event_time) OVER (PARTITION BY e.device_id ORDER BY e.event_time) AS next_down_time
          FROM device_events e
          WHERE e.status = 'down' AND e.device_id = ?
        ) t
        WHERE next_down_time IS NOT NULL
        GROUP BY device_id
      `;

      const [rows] = await mysqlPool.execute(sqlQuery, [device_id]);
      logger.info(`[ReportingService] MTBF calculated for device ${device_id}`);
      return rows;
    } catch (error) {
      logger.error(`[ReportingService] Error calculating MTBF: ${error.message}`);
      throw new Error('Database error while calculating MTBF');
    }
  };
}

export default new ReportingService();
