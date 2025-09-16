const Joi = require('joi');

const deviceSchema = Joi.object({
  ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required(),
  hostname: Joi.string().max(50).required(),
  status: Joi.number().optional(),
  type_id: Joi.number().optional(),
  location_id: Joi.number().optional(),
  details_id: Joi.number().optional(),
  monitoring_id: Joi.number().optional(),
  codesite: Joi.string().max(45).optional(),
  loss: Joi.number().optional(),
  avg: Joi.number().optional(),
  min: Joi.number().optional(),
  max: Joi.number().optional(),
  uptime: Joi.date().optional(),
  snmp_enabled: Joi.boolean().optional(),
  community: Joi.string().optional(),
  authlevel: Joi.string().optional(),
  authname: Joi.string().optional(),
  authpass: Joi.string().optional(),
  authalgo: Joi.string().optional(),
  cryptopass: Joi.string().optional(),
  cryptoalgo: Joi.string().optional(),
  snmpver: Joi.string().optional(),
  ne_id: Joi.string().max(45).required(),
});

function validateDevice(req, res, next) {
  const { error } = deviceSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  next();
}

module.exports = validateDevice;
