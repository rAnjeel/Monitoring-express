const Joi = require('joi');

class LocationDto {
  static createSchema = Joi.object({
    name: Joi.string().min(1).max(255).required()
      .messages({
        'string.min': 'name doit contenir au moins 1 caractère',
        'string.max': 'name ne peut pas dépasser 255 caractères',
        'any.required': 'name est requis'
      }),
    lat: Joi.number().min(-90).max(90).allow(null)
      .messages({
        'number.min': 'lat doit être >= -90',
        'number.max': 'lat doit être <= 90'
      }),
    lng: Joi.number().min(-180).max(180).allow(null)
      .messages({
        'number.min': 'lng doit être >= -180',
        'number.max': 'lng doit être <= 180'
      })
  });

  static updateSchema = Joi.object({
    name: Joi.string().min(1).max(255),
    lat: Joi.number().min(-90).max(90).allow(null),
    lng: Joi.number().min(-180).max(180).allow(null)
  });

  static querySchema = Joi.object({
    name: Joi.string().allow(''),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
  });

  // Méthode pour transformer les données avant insertion
  static transform(data) {
    return {
      name: data.name,
      lat: data.lat || null,
      lng: data.lng || null
    };
  }

  // Méthode pour formater la réponse
  static format(location) {
    return {
      id: location.id,
      name: location.name,
      lat: location.lat,
      lng: location.lng,
      inserted_date: location.inserted_date
    };
  }
}

module.exports = LocationDto;
