const LocationDto = require('../dto/location.dto');
const logger = require('../logger/logger');

class LocationMiddleware {
  // Validation pour la création d'une location
  static validateCreate = (req, res, next) => {
    try {
      const { error, value } = LocationDto.createSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Location] Validation error (create): ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Données invalides',
          errors: errorMessages
        });
      }

      req.body = LocationDto.transform(value);
      next();
    } catch (err) {
      logger.error(`[Location] Middleware error (create): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };

  // Validation pour la mise à jour d'une location
  static validateUpdate = (req, res, next) => {
    try {
      const { error, value } = LocationDto.updateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Location] Validation error (update): ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Données invalides',
          errors: errorMessages
        });
      }

      req.body = value;
      next();
    } catch (err) {
      logger.error(`[Location] Middleware error (update): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };

  // Validation pour les paramètres de requête
  static validateQuery = (req, res, next) => {
    try {
      const { error, value } = LocationDto.querySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Location] Query validation error: ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Paramètres de requête invalides',
          errors: errorMessages
        });
      }

      req.query = value;
      next();
    } catch (err) {
      logger.error(`[Location] Middleware error (query): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation des paramètres' });
    }
  };

  // Validation de l'ID dans les paramètres
  static validateId = (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!id || id <= 0) {
        logger.warn(`[Location] Invalid ID: ${req.params.id}`);
        return res.status(400).json({
          message: 'ID invalide'
        });
      }

      req.params.id = id;
      next();
    } catch (err) {
      logger.error(`[Location] ID validation error: ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation de l\'ID' });
    }
  };
}

module.exports = LocationMiddleware;
