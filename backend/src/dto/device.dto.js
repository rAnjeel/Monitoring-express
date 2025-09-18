class DeviceDTO {
  constructor({
    device_id,
    id,
    ip,
    hostname,
    status,
    type_device_id,
    location_id,
    codesite,
    loss,
    avg,
    min,
    max,
    uptime,
    snmp_disabled,
    community,
    authlevel,
    authname,
    authpass,
    authalgo,
    cryptopass,
    cryptoalgo,
    snmpver,
    ne_id,
  }) {
    this.device_id = device_id;
    this.id = id;
    this.ip = ip;
    this.hostname = hostname;
    this.status = status;
    this.type_device_id = type_device_id;
    this.location_id = location_id;
    this.codesite = codesite;
    this.loss = loss;
    this.avg = avg;
    this.min = min;
    this.max = max;
    this.uptime = uptime;
    this.snmp_disabled = snmp_disabled;
    this.community = community;
    this.authlevel = authlevel;
    this.authname = authname;
    this.authpass = authpass;
    this.authalgo = authalgo;
    this.cryptopass = cryptopass;
    this.cryptoalgo = cryptoalgo;
    this.snmpver = snmpver;
    this.ne_id = ne_id;
  }
}

module.exports = DeviceDTO;
