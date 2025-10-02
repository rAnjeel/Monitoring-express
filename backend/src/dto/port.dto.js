const Joi = require('joi');

class PortDto {
  static createSchema = Joi.object({
    port_id: Joi.number().integer().allow(null),
    device_id: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'device_id doit être positif',
        'any.required': 'device_id est requis'
      }),
    ifName: Joi.string().allow(null, ''),
    ifDescr: Joi.string().allow(null, ''),
    ifAlias: Joi.string().allow(null, ''),
    ifInOctets: Joi.number().integer().min(0).allow(null),
    ifOutOctets: Joi.number().integer().min(0).allow(null),
    ifOperStatus: Joi.string().max(45).allow(null, ''),
    ifAdminStatus: Joi.string().max(45).allow(null, ''),
    ifMtu: Joi.number().integer().min(0).allow(null),
    ifType: Joi.string().max(45).allow(null, ''),
    ifPhysAddress: Joi.string().max(45).allow(null, ''),
    ifLastChange: Joi.number().integer().allow(null),
    ifHighSpeed: Joi.number().integer().min(0).allow(null),
    ifPromiscuousMode: Joi.boolean().allow(null),
    ifConnectorPresent: Joi.boolean().allow(null),
    ifSpeed: Joi.number().integer().min(0).allow(null),
    ifIndex: Joi.number().integer().min(0).allow(null),
    ne_id: Joi.string().max(45).allow(null, '')
  });

  static updateSchema = Joi.object({
    port_id: Joi.number().integer().allow(null),
    device_id: Joi.number().integer().positive(),
    ifName: Joi.string().allow(null, ''),
    ifDescr: Joi.string().allow(null, ''),
    ifAlias: Joi.string().allow(null, ''),
    ifInOctets: Joi.number().integer().min(0).allow(null),
    ifOutOctets: Joi.number().integer().min(0).allow(null),
    ifOperStatus: Joi.string().max(45).allow(null, ''),
    ifAdminStatus: Joi.string().max(45).allow(null, ''),
    ifMtu: Joi.number().integer().min(0).allow(null),
    ifType: Joi.string().max(45).allow(null, ''),
    ifPhysAddress: Joi.string().max(45).allow(null, ''),
    ifLastChange: Joi.number().integer().allow(null),
    ifHighSpeed: Joi.number().integer().min(0).allow(null),
    ifPromiscuousMode: Joi.boolean().allow(null),
    ifConnectorPresent: Joi.boolean().allow(null),
    ifSpeed: Joi.number().integer().min(0).allow(null),
    ifIndex: Joi.number().integer().min(0).allow(null),
    ne_id: Joi.string().max(45).allow(null, '')
  });

  static querySchema = Joi.object({
    device_id: Joi.number().integer().positive(),
    ifOperStatus: Joi.string().allow(''),
    ifAdminStatus: Joi.string().allow(''),
    ifType: Joi.string().allow(''),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    filter: Joi.string().allow('')
  });

  // Méthode pour transformer les données avant insertion
  static transform(data) {
    return {
      port_id: data.port_id || null,
      device_id: data.device_id,
      ifName: data.ifName || null,
      ifDescr: data.ifDescr || null,
      ifAlias: data.ifAlias || null,
      ifInOctets: data.ifInOctets || null,
      ifOutOctets: data.ifOutOctets || null,
      ifOperStatus: data.ifOperStatus || null,
      ifAdminStatus: data.ifAdminStatus || null,
      ifMtu: data.ifMtu || null,
      ifType: data.ifType || null,
      ifPhysAddress: data.ifPhysAddress || null,
      ifLastChange: data.ifLastChange || null,
      ifHighSpeed: data.ifHighSpeed || null,
      ifPromiscuousMode: data.ifPromiscuousMode || null,
      ifConnectorPresent: data.ifConnectorPresent || null,
      ifSpeed: data.ifSpeed || null,
      ifIndex: data.ifIndex || null,
      ne_id: data.ne_id || null
    };
  }

  // Méthode pour formater la réponse
  static format(port) {
    return {
      id: port.id,
      port_id: port.port_id,
      device_id: port.device_id,
      device_hostname: port.device_hostname, // Si jointure
      ifName: port.ifName,
      ifDescr: port.ifDescr,
      ifAlias: port.ifAlias,
      ifInOctets: port.ifInOctets,
      ifOutOctets: port.ifOutOctets,
      ifOperStatus: port.ifOperStatus,
      ifAdminStatus: port.ifAdminStatus,
      ifMtu: port.ifMtu,
      ifType: port.ifType,
      ifPhysAddress: port.ifPhysAddress,
      ifLastChange: port.ifLastChange,
      ifHighSpeed: port.ifHighSpeed,
      ifPromiscuousMode: port.ifPromiscuousMode,
      ifConnectorPresent: port.ifConnectorPresent,
      ifSpeed: port.ifSpeed,
      ifIndex: port.ifIndex,
      ne_id: port.ne_id
    };
  }
}

module.exports = PortDto;
