const logger = require('../logger/logger');
const deviceEventService = require('../services/deviceEvent.service');

class DeviceEventController {
  // Récupérer tous les événements avec pagination et filtres
  getAll = async (req, res) => {
    try {
      const { page, pageSize, device_id, status, start_date, end_date } = req.query;
      
      const result = await deviceEventService.getAll({
        page,
        pageSize,
        device_id,
        status,
        start_date,
        end_date
      });

      res.json(result);
    } catch (error) {
      logger.error(`[DeviceEventController] Error in getAll: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // Récupérer un événement par ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const event = await deviceEventService.get(id);

      if (!event) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }

      res.json(event);
    } catch (error) {
      logger.error(`[DeviceEventController] Error in getById: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // Récupérer tous les événements d'un device spécifique
  getByDeviceId = async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { page, pageSize, status, start_date, end_date } = req.query;

      const result = await deviceEventService.getByDeviceId(deviceId, {
        page,
        pageSize,
        status,
        start_date,
        end_date
      });

      res.json(result);
    } catch (error) {
      logger.error(`[DeviceEventController] Error in getByDeviceId: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // Créer un nouvel événement
  create = async (req, res) => {
    try {
      const eventId = await deviceEventService.create(req.body);
      
      res.status(201).json({ 
        id: eventId,
        message: 'Événement créé avec succès'
      });
    } catch (error) {
      logger.error(`[DeviceEventController] Error in create: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // Mettre à jour un événement
  update = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Vérifier que l'événement existe
      const existingEvent = await deviceEventService.get(id);
      if (!existingEvent) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }

      await deviceEventService.update(id, req.body);
      
      res.json({ message: 'Événement mis à jour avec succès' });
    } catch (error) {
      logger.error(`[DeviceEventController] Error in update: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // Supprimer un événement
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Vérifier que l'événement existe
      const existingEvent = await deviceEventService.get(id);
      if (!existingEvent) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }

      await deviceEventService.delete(id);
      
      res.json({ message: 'Événement supprimé avec succès' });
    } catch (error) {
      logger.error(`[DeviceEventController] Error in delete: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // Récupérer les statistiques d'événements pour un device
  getStats = async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { days = 30 } = req.query;

      const stats = await deviceEventService.getStats(deviceId, parseInt(days));
      
      res.json({
        device_id: deviceId,
        period_days: parseInt(days),
        statistics: stats
      });
    } catch (error) {
      logger.error(`[DeviceEventController] Error in getStats: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // Récupérer les derniers événements (pour dashboard)
  getRecent = async (req, res) => {
    try {
      const { limit = 10, status } = req.query;
      
      const result = await deviceEventService.getAll({
        page: 1,
        pageSize: parseInt(limit),
        status
      });

      res.json({
        events: result.rows,
        total: result.totalCount
      });
    } catch (error) {
      logger.error(`[DeviceEventController] Error in getRecent: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // Créer un événement de changement de statut (endpoint interne)
  createStatusChange = async (req, res) => {
    try {
      const { deviceId, status, pingData } = req.body;
      
      if (!deviceId || !status) {
        return res.status(400).json({ 
          message: 'device_id et status sont requis' 
        });
      }

      const eventId = await deviceEventService.createStatusChangeEvent(
        deviceId, 
        status === 'up', 
        pingData || {}
      );
      
      res.status(201).json({ 
        id: eventId,
        message: 'Événement de changement de statut créé'
      });
    } catch (error) {
      logger.error(`[DeviceEventController] Error in createStatusChange: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };
}

module.exports = new DeviceEventController();
