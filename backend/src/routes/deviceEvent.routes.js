const express = require('express');
const router = express.Router();
const deviceEventController = require('../controllers/deviceEvent.controller');
const deviceEventMiddleware = require('../middlewares/deviceEvent.middleware');

// Routes pour les événements de devices

// GET /device-events - Récupérer tous les événements avec pagination et filtres
router.get('/', 
  deviceEventMiddleware.validateQuery,
  deviceEventController.getAll
);

// GET /device-events/recent - Récupérer les événements récents (pour dashboard)
router.get('/recent', 
  deviceEventController.getRecent
);

// GET /device-events/:id - Récupérer un événement par ID
router.get('/:id', 
  deviceEventMiddleware.validateId,
  deviceEventController.getById
);

// POST /device-events - Créer un nouvel événement
router.post('/', 
  deviceEventMiddleware.validateCreate,
  deviceEventController.create
);

// PUT /device-events/:id - Mettre à jour un événement
router.put('/:id', 
  deviceEventMiddleware.validateId,
  deviceEventMiddleware.validateUpdate,
  deviceEventController.update
);

// DELETE /device-events/:id - Supprimer un événement
router.delete('/:id', 
  deviceEventMiddleware.validateId,
  deviceEventController.delete
);

// Routes spécifiques aux devices

// GET /device-events/device/:deviceId - Récupérer tous les événements d'un device
router.get('/device/:deviceId', 
  deviceEventMiddleware.validateDeviceId,
  deviceEventMiddleware.validateQuery,
  deviceEventController.getByDeviceId
);

// GET /device-events/device/:deviceId/stats - Récupérer les statistiques d'un device
router.get('/device/:deviceId/stats', 
  deviceEventMiddleware.validateDeviceId,
  deviceEventController.getStats
);

// POST /device-events/status-change - Créer un événement de changement de statut (endpoint interne)
router.post('/status-change', 
  deviceEventController.createStatusChange
);

module.exports = router;
