CREATE DATABASE  IF NOT EXISTS monitoring;
USE monitoring;

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
    device_id INT UNIQUE DEFAULT NULL,
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(30),
    hostname varchar(50) NOT NULL,
    sysName varchar(200),
    status INT DEFAULT NULL,
    ping_status INT,
    type_device_id INT,
    location_id INT,
    details_id INT DEFAULT NULL,
    monitoring_id INT DEFAULT NULL,
    codesite varchar(45) DEFAULT NULL,
    loss FLOAT DEFAULT NULL,
    avg FLOAT DEFAULT NULL,
    min FLOAT DEFAULT NULL,
    max FLOAT DEFAULT NULL,
    uptime datetime,
    snmp_disable BOOLEAN,
    community text,
    authlevel text,
    authname text,
    authpass text,
    authalgo text,
    cryptopass text,
    cryptoalgo text,
    snmpver text,
    ne_id varchar(45) NOT NULL,
    FOREIGN KEY (type_device_id) REFERENCES type_device(id),
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
    port_id INT,
    device_id INT NOT NULL,
    ifName text,
    ifDescr text,
    ifAlias text,
    ifInOctets BIGINT,
    ifOutOctets BIGINT,
    ifOperStatus varchar(45),
    ifAdminStatus varchar(45),
    ifMtu INT,
    ifType varchar(45),
    ifPhysAddress varchar(45),
    ifLastChange INT,
    ifHighSpeed INT,
    ifPromiscuousMode BOOLEAN,
    ifConnectorPresent BOOLEAN,
    ifSpeed INT,
    ifIndex INT,
    ne_id varchar(45),
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE port_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  port_id INT NOT NULL,
  ifInOctets BIGINT DEFAULT 0,
  ifOutOctets BIGINT DEFAULT 0,
  errors BIGINT DEFAULT 0,
  rate_up FLOAT DEFAULT NULL,
  rate_down FLOAT DEFAULT NULL,
  status ENUM('up','down','warning') NOT NULL,
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT DEFAULT NULL,
  message VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (port_id) REFERENCES ports(id) ON DELETE CASCADE
);


