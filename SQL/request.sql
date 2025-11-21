SELECT
  d.device_id,
  d.id,
  d.ip,
  d.hostname,
  d.status,
  d.codesite,
  d.loss,
  d.avg,
  d.min,
  d.max,
  d.uptime,
  d.snmp_disabled,
  d.community,
  d.authlevel,
  d.authname,
  d.authpass,
  d.authalgo,
  d.cryptopass,
  d.cryptoalgo,
  d.snmpver,
  d.ne_id,
  td.name  AS type_name,
  l.name   AS location_name
FROM devices d
LEFT JOIN type_device td ON td.id = d.type_device_id
LEFT JOIN locations   l  ON l.id  = d.location_id;

-- Check doublons
SELECT
    port_id,
    COUNT(port_id) AS NombreDoublons
FROM
    ports
GROUP BY
    port_id
HAVING
    COUNT(port_id) > 1
ORDER BY
    NombreDoublons DESC;

-- Effacer doublons
DELETE p1
FROM
    ports p1
INNER JOIN (
    SELECT
        MIN(id) AS min_id,
        port_id
    FROM
        ports
    GROUP BY
        port_id
    HAVING
        COUNT(port_id) > 1
) AS doublons ON p1.port_id = doublons.port_id
WHERE
    p1.id > doublons.min_id;


SELECT
    p1.port_id 
FROM
    ports p1
INNER JOIN (
    -- La sous-requête reste la même
    SELECT MIN(id) AS min_id, port_id FROM ports GROUP BY port_id HAVING COUNT(port_id) > 1
) AS doublons ON p1.port_id = doublons.port_id
WHERE
    p1.id > doublons.min_id;

-- Pour voir la taille des tables en MB dans MySQL
SELECT
    table_name AS `Table`,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS `Taille (MB)`
FROM
    information_schema.TABLES
WHERE
    TABLE_SCHEMA = 'monitoring'
    AND TABLE_NAME = 'device_events';

-- Reorganiser les partitions
REORGANIZE PARTITION p_futur INTO (
    PARTITION p_202411 VALUES LESS THAN (TO_DAYS('2024-12-01')),
    PARTITION p_futur VALUES LESS THAN MAXVALUE
);

-- Partitionner la table device_events
ALTER TABLE device_events
    PARTITION BY RANGE (TO_DAYS(event_time)) (
        -- 1. Partition pour l'historique très ancien (avant 2023)
        PARTITION p_historique VALUES LESS THAN (TO_DAYS('2023-01-01')),
        
        -- 2. Partition pour l'année 2023
        PARTITION p_2023 VALUES LESS THAN (TO_DAYS('2024-01-01')),
        
        -- 3. Partition pour 2024 (si votre table est active en 2024)
        PARTITION p_2024 VALUES LESS THAN (TO_DAYS('2025-01-01')),
        
        -- 4. Partition cruciale : pour toutes les données futures (et actuelles non encore définies)
        PARTITION p_futur VALUES LESS THAN MAXVALUE
    );
-- NB: Pour que les partitions soient créées, il faut que la table existe déjà et event_time soit cle primaire.

ALTER TABLE device_events
PARTITION BY RANGE ( TO_DAYS(event_time) ) (
PARTITION p_wk01_oct VALUES LESS THAN ( TO_DAYS('2025-10-06') ),
PARTITION p_wk02_oct VALUES LESS THAN ( TO_DAYS('2025-10-13') ),
PARTITION p_wk03_oct VALUES LESS THAN ( TO_DAYS('2025-10-20') ),
PARTITION p_wk04_oct VALUES LESS THAN ( TO_DAYS('2025-10-27') ),
PARTITION p_future VALUES LESS THAN MAXVALUE
);


SELECT
    *
FROM
    device_events
WHERE
    event_time >= '2025-10-16 00:00:00'
    AND event_time <= '2025-10-17 07:54:27'
ORDER BY
    event_time DESC;








--Reset commit git
git reset --soft HEAD~2


SELECT 
  DATE(e.event_time) AS jour,
  ROUND(AVG(e.avg), 2) AS avg_latency_ms,
  ROUND(MIN(e.min), 2) AS min_latency_ms,
  ROUND(MAX(e.max), 2) AS max_latency_ms,
  ROUND(SUM(CASE WHEN e.status = 'up' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS availability_percent
FROM device_events e
JOIN devices d ON d.id = e.device_id
WHERE e.event_time BETWEEN '2025-10-01 00:00:00' AND '2025-10-27 23:59:59'
GROUP BY jour
ORDER BY jour ASC;


SELECT 
  DATE(e.event_time) AS jour,
  ROUND(AVG(e.avg), 2) AS avg_latency_ms,
  ROUND(MIN(e.min), 2) AS min_latency_ms,
  ROUND(MAX(e.max), 2) AS max_latency_ms,
  ROUND(SUM(CASE WHEN e.status = 'up' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS availability_percent
FROM device_events e
JOIN devices d ON d.id = e.device_id
WHERE d.type_device_id = 3
GROUP BY jour
ORDER BY jour ASC;

SELECT 
  DATE(e.event_time) AS jour,
  d.hostname AS hostname,
  ROUND(AVG(e.avg), 2) AS avg_latency_ms,
  ROUND(MIN(e.min), 2) AS min_latency_ms,
  ROUND(MAX(e.max), 2) AS max_latency_ms,
  ROUND(SUM(CASE WHEN e.status = 'up' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS availability_percent
FROM device_events e
JOIN devices d ON d.id = e.device_id
WHERE e.event_time BETWEEN '2025-10-01 00:00:00' AND '2025-10-27 23:59:59'
GROUP BY jour, d.hostname
ORDER BY jour ASC;

