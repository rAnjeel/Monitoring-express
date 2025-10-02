const DeviceDto = require('../dto/device.dto');
const logger = require('../logger/logger');

class DeviceMiddleware {
  // Validation pour la création d'un device
  static validateCreate = (req, res, next) => {
    try {
      const { error, value } = DeviceDto.createSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Device] Validation error (create): ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Données invalides',
          errors: errorMessages
        });
      }

      req.body = DeviceDto.transform(value);
      next();
    } catch (err) {
      logger.error(`[Device] Middleware error (create): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };

  // Validation pour la mise à jour d'un device
  static validateUpdate = (req, res, next) => {
    try {
      const { error, value } = DeviceDto.updateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Device] Validation error (update): ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Données invalides',
          errors: errorMessages
        });
      }

      req.body = value;
      next();
    } catch (err) {
      logger.error(`[Device] Middleware error (update): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation' });
    }
  };

  // Validation pour les paramètres de requête
  static validateQuery = (req, res, next) => {
    try {
      const { error, value } = DeviceDto.querySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn(`[Device] Query validation error: ${errorMessages.join(', ')}`);
        return res.status(400).json({
          message: 'Paramètres de requête invalides',
          errors: errorMessages
        });
      }

      req.query = value;
      next();
    } catch (err) {
      logger.error(`[Device] Middleware error (query): ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation des paramètres' });
    }
  };

  // Validation de l'ID dans les paramètres
  static validateId = (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!id || id <= 0) {
        logger.warn(`[Device] Invalid ID: ${req.params.id}`);
        return res.status(400).json({
          message: 'ID invalide'
        });
      }

      req.params.id = id;
      next();
    } catch (err) {
      logger.error(`[Device] ID validation error: ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation de l\'ID' });
    }
  };

  // Validation pour l'import CSV
  static validateImportCSV = (req, res, next) => {
    try {
      if (!Array.isArray(req.body)) {
        logger.warn('[Device] Import CSV: payload must be an array');
        return res.status(400).json({
          message: 'Le payload doit être un tableau de lignes'
        });
      }

      if (req.body.length === 0) {
        logger.warn('[Device] Import CSV: empty array');
        return res.status(400).json({
          message: 'Le tableau ne peut pas être vide'
        });
      }

      next();
    } catch (err) {
      logger.error(`[Device] CSV validation error: ${err.message}`);
      res.status(500).json({ message: 'Erreur de validation CSV' });
    }
  };
}

module.exports = DeviceMiddleware;
