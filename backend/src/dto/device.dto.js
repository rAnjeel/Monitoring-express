class DeviceDTO {
  constructor({
    device_id,
    ip,
    hostname,
    status,
    type_id,
    location_id,
    codesite,
    loss,
    avg,
    min,
    max,
    uptime,
    snmp_enabled,
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
    this.ip = ip;
    this.hostname = hostname;
    this.status = status;
    this.type_id = type_id;
    this.location_id = location_id;
    this.codesite = codesite;
    this.loss = loss;
    this.avg = avg;
    this.min = min;
    this.max = max;
    this.uptime = uptime;
    this.snmp_enabled = snmp_enabled;
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
