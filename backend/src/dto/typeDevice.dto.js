const Joi = require('joi');

class TypeDeviceDto {
  static createSchema = Joi.object({
    name: Joi.string().min(1).max(100).required()
      .messages({
        'string.min': 'name doit contenir au moins 1 caractère',
        'string.max': 'name ne peut pas dépasser 100 caractères',
        'any.required': 'name est requis'
      })
  });

  static updateSchema = Joi.object({
    name: Joi.string().min(1).max(100)
      .messages({
        'string.min': 'name doit contenir au moins 1 caractère',
        'string.max': 'name ne peut pas dépasser 100 caractères'
      })
  });

  static querySchema = Joi.object({
    name: Joi.string().allow(''),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
  });

  // Méthode pour transformer les données avant insertion
  static transform(data) {
    return {
      name: data.name.trim()
    };
  }

  // Méthode pour formater la réponse
  static format(typeDevice) {
    return {
      id: typeDevice.id,
      name: typeDevice.name,
      // Champs additionnels si jointures
      total_devices: typeDevice.total_devices,
      down_devices: typeDevice.down_devices
    };
  }
}

module.exports = TypeDeviceDto;
