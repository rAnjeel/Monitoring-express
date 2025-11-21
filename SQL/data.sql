-- Type device
INSERT INTO `type_device` VALUES (1,'ROUTER'),(2,'SWITCH'),(3,'IPDSLAM'),(4,'TCU'),(5,'R6K'),(6,'2G'),(7,'3G'),(8,'4G'),(9,'5G'),(10,'AIRPON');

-- Locations
INSERT INTO `locations` VALUES (3,'TNR',36.650627,-94.443550,'2018-08-31 15:45:04'),(4,'LON',34.150078,-105.123886,'2018-08-31 15:50:05'),(5,'PAR',50.350819,-4.702452,'2018-08-31 15:55:05'),(6,'Nosy-Be-La-Chapelle',-13.315019,48.259262,'2018-08-31 16:00:05'),(7,'Nosy-Be- Bemanondro',-13.315019,48.259262,'2018-08-31 16:00:26'),(8,'Nosy-Be-Bemoko',-13.302695,48.173817,'2018-08-31 16:00:32'),(9,'TMM',30.216045,-81.566841,'2018-08-31 16:00:33'),(10,'Nosy-Be- Antanimalandy',-13.315019,48.259262,'2018-08-31 16:00:33'),(11,'Nosy-Be-Hellville',-13.397099,48.266727,'2018-08-31 16:05:04'),(12,'Nosy-Be-La-Vigie',-13.315019,48.259262,'2018-08-31 16:05:18'),(13,'Nosy-Be- Ivoririka',-13.315019,48.259262,'2018-08-31 16:05:35'),(14,'MJG',34.426857,-100.199402,'2018-08-31 16:05:37'),(15,'ABE',38.973701,-95.234680,'2018-08-31 16:05:47'),(16,'TUL',36.198776,-95.883865,'2018-08-31 16:05:57'),(17,'MAN',36.368244,-96.009377,'2018-08-31 16:06:13'),(18,'FNR',32.937954,-96.740181,'2018-08-31 16:06:24'),(19,'TLE',36.507229,-94.277283,'2018-08-31 16:11:25'),(21,'DIE',38.347755,-97.026039,'2018-08-31 16:15:33'),(22,'NSB',43.148827,-93.240028,'2018-08-31 16:15:52'),(23,'MDV',35.407906,-97.490005,'2018-09-17 11:42:41'),(24,'REU',41.954800,-87.727287,'2018-09-17 11:48:31'),(25,'FTU',29.783007,-95.551033,'2018-09-17 14:28:50'),(26,'SMB',37.082275,-94.458885,'2018-09-17 14:43:03'),(27,'MRM',33.213421,-117.263275,'2018-09-17 14:43:56'),(28,'ANT',38.832874,-94.690727,'2018-09-17 14:49:09'),(29,'Ambanja',-13.663534,48.453743,'2018-09-17 15:08:51'),(30,'Nosy-Be-Antanimalandy',-13.315019,48.259262,'2018-09-20 10:38:31'),(31,'Nosy-Be-Bemanondro',-13.315019,48.259262,'2018-09-20 10:49:00'),(32,'AMBATONDRAZAKA',-17.833635,48.408802,'2018-09-20 10:49:15'),(33,'Nosy-Be-La-Cratere',-13.398440,48.213772,'2018-09-20 10:59:53'),(34,'Nosy-Be-Hellville-1',-13.397099,48.266727,'2018-09-20 11:03:03'),(35,'Nosy-Be-Ivoririka',-13.315019,48.259262,'2018-09-20 11:34:13'),(36,'Nosy-Be-Hellville-2',-13.397099,48.266727,'2018-09-20 12:03:00'),(37,'JHB',-26.204103,28.047304,'2018-09-20 12:09:00'),(38,'Analakely',-18.906546,47.526928,'2018-09-21 11:24:37'),(39,'MJN',41.911140,-88.298851,'2018-09-21 11:24:39'),(40,'Galaxy',36.751816,-95.985718,'2018-09-21 11:59:50'),(41,'MOR',37.336994,-95.286064,'2018-10-04 09:14:49'),(42,'TMM-Orange',NULL,NULL,'2019-06-01 05:21:30'),(45,'TRM_REU_POP',NULL,NULL,'2019-06-01 04:29:46'),(46,'TRM_MAY_POP',NULL,NULL,'2019-06-01 04:27:58'),(47,'Antalaha',NULL,NULL,'2019-06-01 05:36:22'),(48,'vak028',NULL,NULL,'2019-06-01 05:41:17'),(50,'Maroantsetra',NULL,NULL,'2019-06-01 12:11:35'),(51,'Antsohihy',NULL,NULL,'2019-06-01 05:54:48'),(52,'Ambilobe',NULL,NULL,'2019-06-01 05:05:10'),(53,'Ambondromamy',NULL,NULL,'2019-06-01 05:45:35'),(54,'Moramanga',NULL,NULL,'2019-06-01 04:55:37'),(55,'Fenerive-Est',NULL,NULL,'2019-06-01 05:00:35'),(56,'Tanambe-Centre',NULL,NULL,'2019-06-01 05:05:52'),(57,'ANDAPA',NULL,NULL,'2019-06-01 05:35:27'),(58,'SAMBAVA',NULL,NULL,'2019-06-01 04:47:55'),(59,'IVORIRIKA',NULL,NULL,'2019-05-31 14:41:20'),(60,'ANALAVORY',NULL,NULL,'2019-06-01 18:09:44'),(61,'Ambovombe',NULL,NULL,'2019-06-01 02:26:11'),(62,'< ... >',NULL,NULL,'2019-06-01 14:51:36'),(63,'Soavinandriana',NULL,NULL,'2019-05-31 22:36:36'),(64,'ankazobe',NULL,NULL,'2019-05-31 15:06:45'),(65,'Maintirano',NULL,NULL,'2019-06-02 11:11:24'),(66,'Maroanstsetra-2',NULL,NULL,'2019-06-02 11:26:11'),(67,'VOHEMAR',NULL,NULL,'2019-05-31 15:25:04'),(68,'Befandriana-SOF006',NULL,NULL,'2019-06-01 16:37:03'),(69,'JVA',NULL,NULL,'2019-06-01 16:37:03');

-- Initial monitoring_settings values
INSERT INTO monitoring_settings (`setting_key`, `setting_value`, `type`, `description`) VALUES
  ('PING_LOSS_THRESHOLD', '80', 'number', 'Packet loss threshold (%) for ping alerts'),
  ('SCHEDULER_INTERVAL_MS', '60000', 'number', 'Scheduler interval for device checks (ms)'),
  ('SCHEDULER_PORTS_INTERVAL_MS', '60000', 'number', 'Scheduler interval for port checks (ms)'),
  ('FLAPPING_MIN_THRESHOLD', '10', 'number', 'Minimum number of flapping events'),
  ('FLAPPING_MAX_THRESHOLD', '30', 'number', 'Maximum number of flapping events');

-- Extract to csv devices
SELECT device_id,id,ip,hostname,sysName,status,Ping_status,type_device_id,location_id,codesite,loss,avg,min,max,uptime,snmp_disable,community,authlevel,authname,authpass,authalgo,cryptopass,cryptoalgo,snmpver,ne_id
FROM devices
INTO OUTFILE '/var/lib/mysql-files/devices.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

SELECT id,port_id,device_id,ifName,ifIndex,ifSpeed,ifConnectorPresent,ifPromiscuousMode,ifHighSpeed,ifDescr,ifAlias,ifInOctets,ifOutOctets,ifOperStatus,ifAdminStatus, ifMtu,ifType,ifPhysAddress,ne_id 
FROM ports
INTO OUTFILE '/var/lib/mysql-files/ports.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

LOAD DATA INFILE '/var/lib/mysql-files/ports2.csv'
INTO TABLE ports
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/var/lib/mysql-files/devices.csv'
INTO TABLE devices
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

-- Split ports.csv into 1000 lines each
split -l 30000 ports.csv port_

INSERT INTO ports (id, port_id, device_id, ifName, ifIndex, ifSpeed, ifConnectorPresent, ifPromiscuousMode, ifHighSpeed, ifDescr, ifAlias, ifInOctets, ifOutOctets, ifOperStatus, ifAdminStatus, ifMtu, ifType, ifPhysAddress, ne_id) VALUES
(1, 473, 8, 'Cpos1/0/0', 100, 155000000, TRUE, FALSE, 155, 'Cpos1/0/0', 'Cpos1/0/0', 0, 0, 'up', 'up', 0, 'pos', '0', NULL),
(2, 474, 8, 'Cpos1/0/1', 101, 155000000, TRUE, FALSE, 155, 'Cpos1/0/1', 'Cpos1/0/1', 0, 0, 'down', 'down', 0, 'pos', '0', NULL),
(3, 475, 8, 'Cpos1/0/2', 102, 155000000, TRUE, FALSE, 155, 'Cpos1/0/2', 'Cpos1/0/2', 0, 0, 'down', 'down', 0, 'pos', '0', NULL),
(4, 476, 8, 'Cpos1/0/3', 103, 155000000, TRUE, FALSE, 155, 'Cpos1/0/3', 'Cpos1/0/3', 0, 0, 'down', 'down', 0, 'pos', '0', NULL),
(5, 11422, 18, 'NULL0', 1, 0, FALSE, FALSE, 0, 'NULL0', 'NULL0', 0, 0, 'up', 'up', 1500, 'other', '0', NULL),
(6, 11423, 18, 'InLoopBack0', 2, 0, FALSE, FALSE, 0, 'InLoopBack0', 'InLoopBack0', 0, 0, 'up', 'up', 1500, 'softwareLoopback', '0', NULL),
(7, 11424, 18, 'GigabitEthernet0/0/0', 3, 10000000, TRUE, FALSE, 10, 'GigabitEthernet0/0/0', 'acces|0|nsb-hlv-ar-1-outband-mgt', 0, 0, 'down', 'up', 1500, 'ethernetCsmacd', '04bd70f8d880', NULL),
(8, 11425, 2, 'InLoopBack0', 1, 0, FALSE, FALSE, 0, 'InLoopBack0', 'HUAWEI, InLoopBack0 Interface', 48948201, 2290756, 'up', 'up', 1500, 'softwareLoopback', '0', NULL),
(9, 11426, 2, 'NULL0', 2, 0, FALSE, FALSE, 0, 'NULL0', 'HUAWEI, NULL0 Interface', 0, 0, 'up', 'up', 1500, 'other', '0', NULL),
(10, 11427, 2, 'Console0/0/0', 3, 0, TRUE, FALSE, 0, 'Console0/0/0', 'HUAWEI, Console0/0/0 Interface', 0, 0, 'up', 'up', 0, 'other', '0', NULL);




