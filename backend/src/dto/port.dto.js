class PortDTO {
  constructor({
    id,
    port_id,
    device_id,
    ifName,
    ifDescr,
    ifAlias,
    in_octets,
    out_octets,
    status,
    ne_id,
  }) {
    this.id = id;
    this.port_id = port_id;
    this.device_id = device_id;
    this.ifName = ifName;
    this.ifDescr = ifDescr;
    this.ifAlias = ifAlias;
    this.in_octets = in_octets;
    this.out_octets = out_octets;
    this.status = status;
    this.ne_id = ne_id;
  }
}

module.exports = PortDTO;
