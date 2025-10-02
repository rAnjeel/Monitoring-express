const Joi = require('joi');

class DeviceEventDto {
  static createSchema = Joi.object({
    device_id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'device_id doit être un nombre',
        'number.integer': 'device_id doit être un entier',
        'number.positive': 'device_id doit être positif',
        'any.required': 'device_id est requis'
      }),
    
    loss: Joi.number().min(0).max(100).allow(null)
      .messages({
        'number.base': 'loss doit être un nombre',
        'number.min': 'loss doit être >= 0',
        'number.max': 'loss doit être <= 100'
      }),
    
    avg: Joi.number().min(0).default(0)
      .messages({
        'number.base': 'avg doit être un nombre',
        'number.min': 'avg doit être >= 0'
      }),
    
    min: Joi.number().min(0).default(0)
      .messages({
        'number.base': 'min doit être un nombre',
        'number.min': 'min doit être >= 0'
      }),
    
    max: Joi.number().min(0).default(0)
      .messages({
        'number.base': 'max doit être un nombre',
        'number.min': 'max doit être >= 0'
      }),
    
    status: Joi.string().valid('up', 'down', 'warning').required()
      .messages({
        'string.base': 'status doit être une chaîne',
        'any.only': 'status doit être: up, down ou warning',
        'any.required': 'status est requis'
      }),
    
    event_time: Joi.date().allow(null)
      .messages({
        'date.base': 'event_time doit être une date valide'
      })
  });

  static updateSchema = Joi.object({
    loss: Joi.number().min(0).max(100).allow(null),
    avg: Joi.number().min(0),
    min: Joi.number().min(0),
    max: Joi.number().min(0),
    status: Joi.string().valid('up', 'down', 'warning'),
    event_time: Joi.date().allow(null)
  });

  static querySchema = Joi.object({
    device_id: Joi.number().integer().positive(),
    status: Joi.string().valid('up', 'down', 'warning'),
    start_date: Joi.date(),
    end_date: Joi.date(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
  });

  // Méthode pour transformer les données avant insertion
  static transform(data) {
    return {
      device_id: data.device_id,
      loss: data.loss || null,
      avg: data.avg || 0,
      min: data.min || 0,
      max: data.max || 0,
      status: data.status,
      event_time: data.event_time || new Date()
    };
  }

  // Méthode pour formater la réponse
  static format(deviceEvent) {
    return {
      id: deviceEvent.id,
      device_id: deviceEvent.device_id,
      loss: deviceEvent.loss,
      avg: deviceEvent.avg,
      min: deviceEvent.min,
      max: deviceEvent.max,
      status: deviceEvent.status,
      event_time: deviceEvent.event_time
    };
  }
}

module.exports = DeviceEventDto;
