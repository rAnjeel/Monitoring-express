import express from 'express';
const router = express.Router();
import deviceEventController from '../controllers/deviceEvent.controller.js';
import DeviceEventMiddleware from '../middlewares/deviceEvent.middleware.js';

// Routes pour les événements de devices

// GET /device-events - Récupérer tous les événements avec pagination et filtres
router.get('/', 
  DeviceEventMiddleware.validateQuery,
  deviceEventController.getAll
);

// GET /device-events/recent - Récupérer les événements récents (pour dashboard)
router.get('/recent', 
  deviceEventController.getRecent
);

// GET /device-events/:id - Récupérer un événement par ID
router.get('/:id', 
  DeviceEventMiddleware.validateId,
  deviceEventController.getById
);

// POST /device-events - Créer un nouvel événement
router.post('/', 
  DeviceEventMiddleware.validateCreate,
  deviceEventController.create
);

// PUT /device-events/:id - Mettre à jour un événement
router.put('/:id', 
  DeviceEventMiddleware.validateId,
  DeviceEventMiddleware.validateUpdate,
  deviceEventController.update
);

// DELETE /device-events/:id - Supprimer un événement
router.delete('/:id', 
  DeviceEventMiddleware.validateId,
  deviceEventController.delete
);

// Routes spécifiques aux devices

// GET /device-events/device/:deviceId - Récupérer tous les événements d'un device
router.get('/device/:deviceId',
  deviceEventController.getByDeviceId
);

// GET /device-events/device/:deviceId/stats - Récupérer les statistiques d'un device
router.get('/device/:deviceId/stats', 
  DeviceEventMiddleware.validateDeviceId,
  deviceEventController.getStats
);

// POST /device-events/status-change - Créer un événement de changement de statut (endpoint interne)
router.post('/status-change', 
  deviceEventController.createStatusChange
);

export default router;
