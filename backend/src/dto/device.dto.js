const Joi = require('joi');

class DeviceDto {
  static createSchema = Joi.object({
    device_id: Joi.number().integer().allow(null),
    ip: Joi.string().ip().required()
      .messages({
        'string.ip': 'ip doit être une adresse IP valide',
        'any.required': 'ip est requis'
      }),
    hostname: Joi.string().min(1).max(50).required()
      .messages({
        'string.min': 'hostname doit contenir au moins 1 caractère',
        'string.max': 'hostname ne peut pas dépasser 50 caractères',
        'any.required': 'hostname est requis'
      }),
    sysName: Joi.string().max(200).allow(null, ''),
    ping_status: Joi.boolean().allow(null),
    status: Joi.number().integer().allow(null),
    type_device_id: Joi.number().integer().positive().allow(null)
      .messages({
        'number.positive': 'type_device_id doit être positif'
      }),
    location_id: Joi.number().integer().positive().allow(null)
      .messages({
        'number.positive': 'location_id doit être positif'
      }),
    codesite: Joi.string().max(45).allow(null, ''),
    loss: Joi.number().min(0).max(100).allow(null)
      .messages({
        'number.min': 'loss doit être >= 0',
        'number.max': 'loss doit être <= 100'
      }),
    avg: Joi.number().min(0).default(0),
    min: Joi.number().min(0).default(0),
    max: Joi.number().min(0).default(0),
    uptime: Joi.date().allow(null),
    snmp_disable: Joi.boolean().default(false),
    community: Joi.string().allow(null, ''),
    authlevel: Joi.string().allow(null, ''),
    authname: Joi.string().allow(null, ''),
    authpass: Joi.string().allow(null, ''),
    authalgo: Joi.string().allow(null, ''),
    cryptopass: Joi.string().allow(null, ''),
    cryptoalgo: Joi.string().allow(null, ''),
    snmpver: Joi.string().allow(null, ''),
    ne_id: Joi.string().max(45).required()
      .messages({
        'string.max': 'ne_id ne peut pas dépasser 45 caractères',
        'any.required': 'ne_id est requis'
      })
  });

  static updateSchema = Joi.object({
    ip: Joi.string().ip(),
    hostname: Joi.string().min(1).max(50),
    sysName: Joi.string().max(200).allow(null, ''),
    ping_status: Joi.boolean().allow(null),
    status: Joi.number().integer().allow(null),
    type_device_id: Joi.number().integer().positive().allow(null),
    location_id: Joi.number().integer().positive().allow(null),
    codesite: Joi.string().max(45).allow(null, ''),
    loss: Joi.number().min(0).max(100).allow(null),
    avg: Joi.number().min(0),
    min: Joi.number().min(0),
    max: Joi.number().min(0),
    uptime: Joi.date().allow(null),
    snmp_disable: Joi.boolean(),
    community: Joi.string().allow(null, ''),
    authlevel: Joi.string().allow(null, ''),
    authname: Joi.string().allow(null, ''),
    authpass: Joi.string().allow(null, ''),
    authalgo: Joi.string().allow(null, ''),
    cryptopass: Joi.string().allow(null, ''),
    cryptoalgo: Joi.string().allow(null, ''),
    snmpver: Joi.string().allow(null, ''),
    ne_id: Joi.string().max(45)
  });

  static querySchema = Joi.object({
    type_device_id: Joi.number().integer().positive(),
    location_id: Joi.number().integer().positive(),
    ping_status: Joi.boolean(),
    status: Joi.number().integer(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    filter: Joi.string().allow('')
  });

  // Méthode pour transformer les données avant insertion
  static transform(data) {
    return {
      device_id: data.device_id || null,
      ip: data.ip,
      hostname: data.hostname,
      sysName: data.sysName || null,
      ping_status: data.ping_status || null,
      status: data.status || null,
      type_device_id: data.type_device_id || null,
      location_id: data.location_id || null,
      codesite: data.codesite || null,
      loss: data.loss || null,
      avg: data.avg || 0,
      min: data.min || 0,
      max: data.max || 0,
      uptime: data.uptime || null,
      snmp_disable: data.snmp_disable !== undefined ? data.snmp_disable : false,
      community: data.community || null,
      authlevel: data.authlevel || null,
      authname: data.authname || null,
      authpass: data.authpass || null,
      authalgo: data.authalgo || null,
      cryptopass: data.cryptopass || null,
      cryptoalgo: data.cryptoalgo || null,
      snmpver: data.snmpver || null,
      ne_id: data.ne_id
    };
  }

  // Méthode pour formater la réponse
  static format(device) {
    return {
      id: device.id,
      device_id: device.device_id,
      ip: device.ip,
      hostname: device.hostname,
      sysName: device.sysName,
      ping_status: device.ping_status,
      status: device.status,
      type_device_id: device.type_device_id,
      type_device: device.type_device, // Si jointure
      location_id: device.location_id,
      location: device.location, // Si jointure
      codesite: device.codesite,
      loss: device.loss,
      avg: device.avg,
      min: device.min,
      max: device.max,
      uptime: device.uptime,
      snmp_disable: device.snmp_disable,
      community: device.community,
      authlevel: device.authlevel,
      authname: device.authname,
      authpass: device.authpass,
      authalgo: device.authalgo,
      cryptopass: device.cryptopass,
      cryptoalgo: device.cryptoalgo,
      snmpver: device.snmpver,
      ne_id: device.ne_id
    };
  }
}

module.exports = DeviceDto;
