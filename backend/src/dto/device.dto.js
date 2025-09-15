class DeviceDTO {
  constructor({ ip, hostname, status, type_id, location_id, details_id, monitoring_id, ne_id }) {
    this.ip = ip;
    this.hostname = hostname;
    this.status = status;
    this.type_id = type_id;
    this.location_id = location_id;
    this.details_id = details_id;
    this.monitoring_id = monitoring_id;
    this.ne_id = ne_id;
  }
}

module.exports = DeviceDTO;
