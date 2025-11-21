CREATE TABLE devices (
    device_id INT DEFAULT NULL,
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
    ne_id varchar(45),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (type_device_id) REFERENCES type_device(id),
    FOREIGN KEY (details_id) REFERENCES device_details(id)

);
CREATE INDEX idx_devices_hostname ON devices (hostname);
CREATE INDEX idx_type_device_id ON devices(type_device_id);
CREATE INDEX idx_location_id ON devices(location_id);
CREATE INDEX idx_status_ping ON devices(ping_status);

CREATE TABLE type_device (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE locations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name varchar(255) NOT NULL,
    lat double(10, 6) DEFAULT NULL,
    lng double(10, 6) DEFAULT NULL,
    inserted_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE device_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    os text,
    serial text,
    icon text,
    version text
);

CREATE TABLE device_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    loss FLOAT DEFAULT NULL,
    avg FLOAT DEFAULT 0,
    min FLOAT DEFAULT 0,
    max FLOAT DEFAULT 0,
    status ENUM('up', 'down', 'warning') NOT NULL,
    event_time DATETIME,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE INDEX idx_device_events_device_id ON device_events(device_id);
CREATE INDEX idx_device_events_event_time ON device_events(event_time);

CREATE TABLE ports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    port_id INT,
    device_id INT,
    status varchar(45) DEFAULT 'undefined',
    isMonitored BOOLEAN DEFAULT FALSE,
    ifName text,
    ifDescr text,
    ifAlias text,
    ifInOctets varchar(45),
    ifOutOctets varchar(45),
    ifOperStatus varchar(45),
    ifAdminStatus varchar(45),
    ifMtu text,
    ifType varchar(45),
    ifPhysAddress varchar(45),
    ifLastChange INT,
    ifHighSpeed INT,
    ifPromiscuousMode varchar(45),
    ifConnectorPresent varchar(45),
    ifSpeed BIGINT,
    ifIndex text,
    ne_id varchar(45),
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE INDEX idx_ports_device_id ON ports(device_id);
CREATE INDEX idx_ports_oper_status ON ports(ifOperStatus);
CREATE INDEX idx_ports_in_out ON ports(ifInOctets, ifOutOctets);

CREATE TABLE port_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    port_id INT NOT NULL,
    ifInOctets BIGINT DEFAULT 0,
    ifOutOctets BIGINT DEFAULT 0,
    status ENUM('up', 'down', 'warning') NOT NULL,
    event_time DATETIME,
    FOREIGN KEY (port_id) REFERENCES ports(id) ON DELETE CASCADE
);
CREATE INDEX idx_port_events_port_id ON port_events(port_id);
CREATE INDEX idx_port_events_event_time ON port_events(event_time);
CREATE INDEX idx_port_events_status ON port_events(status);

CREATE TABLE monitoring_settings(
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255),
    setting_value VARCHAR(255),
    type VARCHAR(50),
    description VARCHAR(255),
    inserted_date DATETIME DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE credentials_sites(
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(20),
    codeSite VARCHAR(50),
    siteUsername VARCHAR(50),
    sitePassword VARCHAR(255),
    sitePort INT,
    siteSShVersion VARCHAR(50),
    lastDateChange TIMESTAMP
);

CREATE TABLE credentials_sites_historic(
    id INT AUTO_INCREMENT PRIMARY KEY,
    siteId INT,
    connectionErrorDate TIMESTAMP,
    errorDescription TEXT,
    errorResolutionDate TIMESTAMP,
    errorStatus VARCHAR(50),
    FOREIGN KEY (siteId) REFERENCES credentials_sites(id)
);

CREATE TABLE pass_credentials(
    id INT AUTO_INCREMENT PRIMARY KEY,
    sitePort VARCHAR(50),
    password VARCHAR(255),
    siteSShVersion VARCHAR(100)
);