CREATE DATABASE  IF NOT EXISTS monitoring_equipment;
USE monitoring_equipment;

CREATE TABLE type_device (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE locations (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name varchar(255) NOT NULL,
  lat double(10,6) DEFAULT NULL,
  lng double(10,6) DEFAULT NULL,
  inserted_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    os text,
    serial text,
    icon text,
    version text
);

CREATE TABLE devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(30) NOT NULL,
    hostname varchar(50) NOT NULL,
    status INT DEFAULT NULL,
    type_id INT NOT NULL,
    location_id INT NOT NULL,
    details_id INT,
    monitoring_id INT,
    codesite varchar(45) DEFAULT NULL,
    loss FLOAT DEFAULT NULL,
    avg FLOAT DEFAULT 0,
    min FLOAT DEFAULT 0,
    max FLOAT DEFAULT 0,
    uptime datetime,
    snmp_enabled BOOLEAN DEFAULT FALSE,
    community text,
    authlevel text,
    authname text,
    authpass text,
    authalgo text,
    cryptopass text,
    cryptoalgo text,
    snmpver text,
    ne_id varchar(45) NOT NULL,
    FOREIGN KEY (type_id) REFERENCES type_device(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (details_id) REFERENCES device_details(id)
);

CREATE TABLE device_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT NOT NULL,
  loss FLOAT DEFAULT NULL,
  avg FLOAT DEFAULT 0,
  min FLOAT DEFAULT 0,
  max FLOAT DEFAULT 0,
  status ENUM('up','down','warning') NOT NULL,
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT DEFAULT NULL,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE ports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    ifName text,
    ifDescr text,
    ifAlias text,
    in_octets BIGINT DEFAULT 0,
    out_octets BIGINT DEFAULT 0,
    status ENUM('up','down','warning') NOT NULL,
    ne_id varchar(45) NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE port_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  port_id INT NOT NULL,
  in_octets BIGINT DEFAULT 0,
  out_octets BIGINT DEFAULT 0,
  errors BIGINT DEFAULT 0,
  rate_up FLOAT DEFAULT NULL,
  rate_down FLOAT DEFAULT NULL,
  status ENUM('up','down','warning') NOT NULL,
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT DEFAULT NULL,
  message VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (port_id) REFERENCES ports(id) ON DELETE CASCADE
);


CREATE TABLE `devices_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `os` text,
  `serial` text,
  `icon` text,
  `notes` text,
  `display` varchar(45) DEFAULT NULL,
  `protocol` varchar(255) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `is_remote_lnms` tinyint DEFAULT '0',
  PRIMARY KEY (`id`,`hostname`)
);


