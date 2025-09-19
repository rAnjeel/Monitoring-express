const Joi = require('joi');

const portSchema = Joi.object({
  id: Joi.number().optional(),
  port_id: Joi.number().optional(),
  device_id: Joi.number().required(),
  ifName: Joi.string().allow(null, ''),
  ifDescr: Joi.string().allow(null, ''),
  ifAlias: Joi.string().allow(null, ''),
  ifInOctets: Joi.number().integer().min(0).optional(),
  ifOutOctets: Joi.number().integer().min(0).optional(),
  ifOperStatus: Joi.string().max(45).allow(null, ''),
  ifAdminStatus: Joi.string().max(45).allow(null, ''),
  ifMtu: Joi.number().integer().optional(),
  ifType: Joi.string().max(45).allow(null, ''),
  ifPhysAddress: Joi.string().max(45).allow(null, ''),
  ifLastChange: Joi.number().integer().optional(),
  ifHighSpeed: Joi.number().integer().optional(),
  ifPromiscuousMode: Joi.boolean().optional(),
  ifConnectorPresent: Joi.boolean().optional(),
  ifSpeed: Joi.number().integer().optional(),
  ifIndex: Joi.number().integer().optional(),
  ne_id: Joi.string().max(45).required(),
});

function validatePort(req, res, next) {
  const { error } = portSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details.map((d) => d.message),
    });
  }
  next();
}

module.exports = validatePort;
