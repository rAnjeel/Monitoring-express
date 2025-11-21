-- ============================================================
-- OPTIMISATIONS DE PERFORMANCE - Reporting Module
-- ============================================================
-- Date: 2025-10-27
-- Description: Index composites et tables pré-agrégées pour 
--              améliorer les performances des requêtes de reporting

USE monitoring;

-- ============================================================
-- 1. INDEX COMPOSITES POUR device_events
-- ============================================================

-- Index composite pour optimiser les requêtes de reporting
-- Couvre: device_id, event_time, status
-- Bénéfice: Accélère les JOIN + filtres temporels + calculs d'availability
DROP INDEX IF EXISTS idx_device_events_composite ON device_events;
CREATE INDEX idx_device_events_composite ON device_events(device_id, event_time, status);

-- Index pour les agrégations par période (DATE extraction)
-- Bénéfice: Optimise GROUP BY DATE(event_time)
DROP INDEX IF EXISTS idx_device_events_time_device ON device_events;
CREATE INDEX idx_device_events_time_device ON device_events(event_time, device_id);

-- ============================================================
-- 2. INDEX COMPOSITES POUR devices
-- ============================================================

-- Index pour GROUP BY hostname avec filtre type_device
-- Bénéfice: Accélère les requêtes groupées par site
DROP INDEX IF EXISTS idx_devices_hostname_type ON devices;
CREATE INDEX idx_devices_hostname_type ON devices(hostname, type_device_id);

-- Index composite id + type_device_id pour les JOIN filtrés
DROP INDEX IF EXISTS idx_devices_id_type ON devices;
CREATE INDEX idx_devices_id_type ON devices(id, type_device_id);

-- ============================================================
-- 3. TABLE PRÉ-AGRÉGÉE : daily_device_stats
-- ============================================================

-- Table pour stocker les statistiques journalières pré-calculées
-- Réduit drastiquement le temps de calcul pour les requêtes sur de longues périodes
DROP TABLE IF EXISTS daily_device_stats;
CREATE TABLE daily_device_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    date DATE NOT NULL,
    avg_latency DECIMAL(10,2) DEFAULT NULL COMMENT 'Latence moyenne (ms)',
    min_latency DECIMAL(10,2) DEFAULT NULL COMMENT 'Latence minimale (ms)',
    max_latency DECIMAL(10,2) DEFAULT NULL COMMENT 'Latence maximale (ms)',
    jitter DECIMAL(10,2) DEFAULT NULL COMMENT 'Jitter (max - min)',
    availability_percent DECIMAL(5,2) DEFAULT NULL COMMENT 'Disponibilité (%)',
    total_events INT DEFAULT 0 COMMENT 'Nombre total d\'événements',
    up_events INT DEFAULT 0 COMMENT 'Nombre d\'événements UP',
    down_events INT DEFAULT 0 COMMENT 'Nombre d\'événements DOWN',
    warning_events INT DEFAULT 0 COMMENT 'Nombre d\'événements WARNING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_device_date (device_id, date),
    INDEX idx_date (date),
    INDEX idx_date_device (date, device_id),
    INDEX idx_device_date (device_id, date),
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Statistiques journalières pré-agrégées par équipement';

-- ============================================================
-- 4. PROCÉDURE STOCKÉE : Calcul des stats journalières
-- ============================================================

DROP PROCEDURE IF EXISTS calculate_daily_stats;

DELIMITER $$

CREATE PROCEDURE calculate_daily_stats(
    IN target_date DATE
)
BEGIN
    -- Insert ou update des statistiques pour une date donnée
    INSERT INTO daily_device_stats (
        device_id,
        date,
        avg_latency,
        min_latency,
        max_latency,
        jitter,
        availability_percent,
        total_events,
        up_events,
        down_events,
        warning_events
    )
    SELECT 
        e.device_id,
        DATE(e.event_time) AS date,
        ROUND(AVG(e.avg), 2) AS avg_latency,
        ROUND(AVG(e.min), 2) AS min_latency,
        ROUND(AVG(e.max), 2) AS max_latency,
        ROUND(AVG(e.max - e.min), 2) AS jitter,
        ROUND(SUM(e.status = 'up') / COUNT(*) * 100, 2) AS availability_percent,
        COUNT(*) AS total_events,
        SUM(e.status = 'up') AS up_events,
        SUM(e.status = 'down') AS down_events,
        SUM(e.status = 'warning') AS warning_events
    FROM device_events e
    WHERE DATE(e.event_time) = target_date
    GROUP BY e.device_id, DATE(e.event_time)
    ON DUPLICATE KEY UPDATE
        avg_latency = VALUES(avg_latency),
        min_latency = VALUES(min_latency),
        max_latency = VALUES(max_latency),
        jitter = VALUES(jitter),
        availability_percent = VALUES(availability_percent),
        total_events = VALUES(total_events),
        up_events = VALUES(up_events),
        down_events = VALUES(down_events),
        warning_events = VALUES(warning_events),
        updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- ============================================================
-- 5. EVENT SCHEDULER : Calcul automatique nocturne
-- ============================================================

-- Activer l'event scheduler si nécessaire
SET GLOBAL event_scheduler = ON;

-- Event pour calculer les stats de la veille chaque nuit à 2h du matin
DROP EVENT IF EXISTS daily_stats_calculation;

CREATE EVENT daily_stats_calculation
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
    CALL calculate_daily_stats(CURDATE() - INTERVAL 1 DAY);

-- ============================================================
-- 6. INITIALISATION : Calcul rétroactif (optionnel)
-- ============================================================

-- Décommenter et ajuster les dates pour calculer l'historique
CALL calculate_daily_stats('2025-10-24');
CALL calculate_daily_stats('2025-10-23');
-- ... etc

-- Ou utiliser une boucle pour calculer plusieurs jours
-- (À exécuter manuellement si nécessaire)
/*
DROP PROCEDURE IF EXISTS backfill_daily_stats;

DELIMITER $$

CREATE PROCEDURE backfill_daily_stats(
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    DECLARE current_date DATE;
    SET current_date = start_date;
    
    WHILE current_date <= end_date DO
        CALL calculate_daily_stats(current_date);
        SET current_date = DATE_ADD(current_date, INTERVAL 1 DAY);
    END WHILE;
END$$

DELIMITER ;

-- Exemple d'utilisation:
-- CALL backfill_daily_stats('2025-01-01', '2025-10-27');
*/

-- ============================================================
-- FIN DU SCRIPT D'OPTIMISATION
-- ============================================================

-- Pour vérifier les index créés:
-- SHOW INDEX FROM device_events;
-- SHOW INDEX FROM devices;

-- Pour vérifier la table:
-- SELECT * FROM daily_device_stats LIMIT 10;
