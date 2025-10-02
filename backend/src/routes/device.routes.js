const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const deviceMiddleware = require('../middlewares/device.middleware');

// Routes pour les devices

// GET /devices - Récupérer tous les devices (simple)
router.get('/', 
  deviceController.getAll
);

// GET /devices/list - Récupérer tous les devices avec filtres
router.get('/list', 
  deviceMiddleware.validateQuery,
  deviceController.getList
);

// GET /devices/limit - Récupérer les devices avec pagination
router.get('/limit', 
  deviceMiddleware.validateQuery,
  deviceController.getPage
);

// GET /devices/:id - Récupérer un device par ID
router.get('/:id', 
  deviceMiddleware.validateId,
  deviceController.getById
);

// POST /devices - Créer un nouveau device
router.post('/', 
  deviceMiddleware.validateCreate,
  deviceController.create
);

// POST /devices/import - Importer des devices depuis CSV
router.post('/import', 
  deviceMiddleware.validateImportCSV,
  deviceController.importCSV
);

// PUT /devices/:id - Mettre à jour un device
router.put('/:id', 
  deviceMiddleware.validateId,
  deviceMiddleware.validateUpdate,
  deviceController.update
);

// DELETE /devices/:id - Supprimer un device
router.delete('/:id', 
  deviceMiddleware.validateId,
  deviceController.delete
);

module.exports = router;
