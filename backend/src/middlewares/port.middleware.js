const PortDto = require('../dto/port.dto');
const logger = require('../logger/logger');

class PortMiddleware {
  // Validation pour la création d'un port
  static validateCreate = (req, res, next) => {
    try {
      const { error, value } = PortDto.createSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Port] Validation error (create): ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Données invalides',
          errors: errorMessages
        });
      }

      req.body = PortDto.transform(value);
      next();
    } catch (err) {
      logger.error(`[Port] Middleware error (create): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };

  // Validation pour la mise à jour d'un port
  static validateUpdate = (req, res, next) => {
    try {
      const { error, value } = PortDto.updateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Port] Validation error (update): ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Données invalides',
          errors: errorMessages
        });
      }

      req.body = value;
      next();
    } catch (err) {
      logger.error(`[Port] Middleware error (update): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };

  // Validation pour les paramètres de requête
  static validateQuery = (req, res, next) => {
    try {
      const { error, value } = PortDto.querySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Port] Query validation error: ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Paramètres de requête invalides',
          errors: errorMessages
        });
      }

      req.query = value;
      next();
    } catch (err) {
      logger.error(`[Port] Middleware error (query): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation des paramètres' });
    }
  };

  // Validation de l'ID dans les paramètres
  static validateId = (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!id || id <= 0) {
        logger.warn(`[Port] Invalid ID: ${req.params.id}`);
        return res.status(400).json({
          message: 'ID invalide'
        });
      }

      req.params.id = id;
      next();
    } catch (err) {
      logger.error(`[Port] ID validation error: ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation de l\'ID' });
    }
  };

  // Validation pour l'import CSV
  static validateImportCSV = (req, res, next) => {
    try {
      if (!Array.isArray(req.body)) {
        logger.warn('[Port] Import CSV: payload must be an array');
        return res.status(400).json({
          message: 'Le payload doit être un tableau de lignes'
        });
      }

      if (req.body.length === 0) {
        logger.warn('[Port] Import CSV: empty array');
        return res.status(400).json({
          message: 'Le tableau ne peut pas être vide'
        });
      }

      next();
    } catch (err) {
      logger.error(`[Port] CSV validation error: ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation CSV' });
    }
  };
}

module.exports = PortMiddleware;
