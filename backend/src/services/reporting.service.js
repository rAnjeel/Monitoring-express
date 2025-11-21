import { mysqlPool } from '../config/db.js';
import logger from '../logger/logger.js';
import NodeCache from 'node-cache';

// Cache pour les requêtes de reporting (TTL: 5 minutes)
const reportingCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Vérification toutes les 60 secondes
  useClones: false // Performance: évite le clonage profond
});

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

  getAverageLatencyByDayAndSite = async ({ start_date, end_date, type_device, group_by, device_id, limit = 365, use_cache = true } = {}) => {
    try {
      // Génération de la clé de cache unique
      const cacheKey = `latency_${start_date || 'null'}_${end_date || 'null'}_${type_device || 'null'}_${group_by || 'null'}_${device_id || 'null'}_${limit}`;
      
      // Vérification du cache
      if (use_cache) {
        const cached = reportingCache.get(cacheKey);
        if (cached) {
          logger.info(`[ReportingService] Cache HIT for key: ${cacheKey}`);
          return cached;
        }
      }

      logger.info('[ReportingService] Fetching average latency by day (cache MISS)');

      const whereClauses = [];
      const params = [];
      let groupBy = 'jour';
      let hostnameSelect = '';
      let hostnameJoinSelect = '';

      // Format date SQL : "YYYY-MM-DD HH:MM:SS"
      const formatDateSQL = (d) => new Date(d).toISOString().slice(0, 19).replace('T', ' ');

      // Filtres de période
      if (start_date && end_date) {
        whereClauses.push('e.event_time BETWEEN ? AND ?');
        params.push(formatDateSQL(start_date), formatDateSQL(end_date));
      }

      // Filtre par type d'appareil
      if (type_device) {
        whereClauses.push('d.type_device_id = ?');
        params.push(type_device);
      }

      // Filtre par ID d'appareil
      if (device_id) {
        whereClauses.push('d.id = ?');
        params.push(device_id);
      }

      // Mode "par site" (jour + hostname)
      if (group_by === 'site') {
        groupBy = 'jour, d.hostname';
        hostnameSelect = ', d.hostname AS hostname';
        hostnameJoinSelect = ', d.hostname';
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Limite par défaut pour éviter les requêtes trop lourdes
      const MAX_LIMIT = 730; // 2 ans max
      const safeLimit = Math.min(limit || 365, MAX_LIMIT);

      // Optimisation: Utiliser la table pré-agrégée si disponible et pas de filtre device_id spécifique
      // et que la période est complète (jours entiers)
      const usePreAggregated = !device_id && start_date && end_date;

      let sqlQuery;

      if (usePreAggregated && group_by !== 'site') {
        // Requête optimisée avec la table pré-agrégée
        sqlQuery = `
          SELECT 
            s.date AS jour,
            ROUND(AVG(s.avg_latency), 2) AS avg_latency_ms,
            ROUND(AVG(s.min_latency), 2) AS min_latency_ms,
            ROUND(AVG(s.max_latency), 2) AS max_latency_ms,
            ROUND(AVG(s.jitter), 2) AS jitter_ms,
            ROUND(AVG(s.availability_percent), 2) AS availability_percent
          FROM daily_device_stats s
          INNER JOIN devices d ON d.id = s.device_id
          ${whereClause.replace(/e\./g, 's.').replace('s.event_time', 's.date')}
          GROUP BY s.date
          ORDER BY s.date ASC
          LIMIT ?
        `;
      } else {
        // Requête standard optimisée avec INNER JOIN
        sqlQuery = `
          SELECT 
            DATE(e.event_time) AS jour
            ${hostnameSelect},
            ROUND(AVG(e.avg), 2) AS avg_latency_ms,
            ROUND(AVG(e.min), 2) AS min_latency_ms,
            ROUND(AVG(e.max), 2) AS max_latency_ms,
            ROUND(AVG(e.max - e.min), 2) AS jitter_ms,
            ROUND(SUM(e.status = 'up') / COUNT(*) * 100, 2) AS availability_percent
          FROM device_events e
          INNER JOIN devices d ON d.id = e.device_id
          ${whereClause}
          GROUP BY ${groupBy}
          ORDER BY jour ASC
          LIMIT ?
        `;
      }

      // Ajout de la limite aux paramètres
      const finalParams = params.length > 0 ? [...params, safeLimit] : [safeLimit];

      const [rows] = await mysqlPool.execute(sqlQuery, finalParams);

      // Mise en cache du résultat
      if (use_cache) {
        reportingCache.set(cacheKey, rows);
      }

      logger.info(`[ReportingService] Found ${rows.length} latency records (group_by = ${group_by}, cached = ${use_cache})`);
      return rows;
    } catch (error) {
      logger.error(`[ReportingService] Error fetching average latency by day: ${error.message}`);
      throw new Error('Database error while fetching average latency by day');
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
            WHEN ROUND(SUM(e.status = 'down')/COUNT(*)*100,2) > 5 THEN 'Unstable'
            WHEN ROUND(SUM(e.status = 'down')/COUNT(*)*100,2) BETWEEN 2 AND 5 THEN 'To monitor'
            ELSE 'Stable'
          END AS etat_stabilite
        FROM device_events e
        JOIN devices d ON d.id = e.device_id
        WHERE ${whereClauses.join(' AND ')}
        GROUP BY d.id, d.type_device_id
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

  // Disponibilité (SLA) - Pourcentage du temps UP vs total
  getAvailability = async ({ device_id } = {}) => {
    try {
      logger.info('[ReportingService] Calculating Availability (SLA) for device');

      if (!device_id) {
        throw new Error('device_id is required for Availability calculation');
      }

      const sqlQuery = `
        SELECT 
          device_id,
          ROUND(
            (SUM(CASE WHEN status = 'up' THEN TIMESTAMPDIFF(MINUTE, event_time, next_event_time) ELSE 0 END) /
            SUM(TIMESTAMPDIFF(MINUTE, event_time, next_event_time))) * 100,
            2
          ) AS availability_percent
        FROM (
          SELECT 
            e.device_id,
            e.status,
            e.event_time,
            LEAD(e.event_time) OVER (PARTITION BY e.device_id ORDER BY e.event_time) AS next_event_time
          FROM device_events e
          WHERE e.device_id = ?
        ) t
        WHERE next_event_time IS NOT NULL
        GROUP BY device_id
      `;

      const [rows] = await mysqlPool.execute(sqlQuery, [device_id]);
      logger.info(`[ReportingService] Availability (SLA) calculated for device ${device_id}`);
      return rows;
    } catch (error) {
      logger.error(`[ReportingService] Error calculating Availability: ${error.message}`);
      throw new Error('Database error while calculating Availability');
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
