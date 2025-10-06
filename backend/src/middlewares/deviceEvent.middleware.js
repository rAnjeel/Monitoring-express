import DeviceEventDto from '../dto/deviceEvent.dto.js';
import logger from '../logger/logger.js';

class DeviceEventMiddleware {
  // Validation pour la création d'un événement
  static validateCreate = (req, res, next) => {
    try {
      const { error, value } = DeviceEventDto.createSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[DeviceEvent] Validation error (create): ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Données invalides',
          errors: errorMessages
        });
      }

      req.body = DeviceEventDto.transform(value);
      next();
    } catch (err) {
      logger.error(`[DeviceEvent] Middleware error (create): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };

  // Validation pour la mise à jour d'un événement
  static validateUpdate = (req, res, next) => {
    try {
      const { error, value } = DeviceEventDto.updateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[DeviceEvent] Validation error (update): ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Données invalides',
          errors: errorMessages
        });
      }

      req.body = value;
      next();
    } catch (err) {
      logger.error(`[DeviceEvent] Middleware error (update): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };

  // Validation pour les paramètres de requête
  static validateQuery = (req, res, next) => {
    try {
      const { error, value } = DeviceEventDto.querySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[DeviceEvent] Query validation error: ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Paramètres de requête invalides',
          errors: errorMessages
        });
      }

      req.query = value;
      next();
    } catch (err) {
      logger.error(`[DeviceEvent] Middleware error (query): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation des paramètres' });
    }
  };

  // Validation de l'ID dans les paramètres
  static validateId = (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!id || id <= 0) {
        logger.warn(`[DeviceEvent] Invalid ID: ${req.params.id}`);
        return res.status(400).json({
          message: 'ID invalide'
        });
      }

      req.params.id = id;
      next();
    } catch (err) {
      logger.error(`[DeviceEvent] ID validation error: ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation de l\'ID' });
    }
  };

  // Validation device_id dans les paramètres
  static validateDeviceId = (req, res, next) => {
    try {
      const deviceId = parseInt(req.params.deviceId);
      
      if (!deviceId || deviceId <= 0) {
        logger.warn(`[DeviceEvent] Invalid device ID: ${req.params.deviceId}`);
        return res.status(400).json({
          message: 'Device ID invalide'
        });
      }

      req.params.deviceId = deviceId;
      next();
    } catch (err) {
      logger.error(`[DeviceEvent] Device ID validation error: ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation du Device ID' });
    }
  };
}

export default DeviceEventMiddleware;
