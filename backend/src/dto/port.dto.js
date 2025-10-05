class PortDTO {
  constructor({
    id,
    port_id,
    device_id,
    ifName,
    ifDescr,
    ifAlias,
    ifInOctets,
    ifOutOctets,
    ifOperStatus,
    ifAdminStatus,
    ifMtu,
    ifType,
    ifPhysAddress,
    ifLastChange,
    ifHighSpeed,
    ifPromiscuousMode,
    ifConnectorPresent,
    ifSpeed,
    ifIndex,
    ne_id,
  }) {
    this.id = id;
    this.port_id = port_id;
    this.device_id = device_id;
    this.ifName = ifName;
    this.ifDescr = ifDescr;
    this.ifAlias = ifAlias;
    this.ifInOctets = ifInOctets;
    this.ifOutOctets = ifOutOctets;
    this.ifOperStatus = ifOperStatus;
    this.ifAdminStatus = ifAdminStatus;
    this.ifMtu = ifMtu;
    this.ifType = ifType;
    this.ifPhysAddress = ifPhysAddress;
    this.ifLastChange = ifLastChange;
    this.ifHighSpeed = ifHighSpeed;
    this.ifPromiscuousMode = ifPromiscuousMode;
    this.ifConnectorPresent = ifConnectorPresent;
    this.ifSpeed = ifSpeed;
    this.ifIndex = ifIndex;
    this.ne_id = ne_id;
  }
}

export default PortDTO;
