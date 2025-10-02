const express = require('express');
const router = express.Router();
const typeDeviceController = require('../controllers/typeDevice.controller');
const typeDeviceMiddleware = require('../middlewares/typeDevice.middleware');

// Routes pour les types de devices

// GET /type-devices - Récupérer tous les types de devices
router.get('/', 
  typeDeviceMiddleware.validateQuery,
  typeDeviceController.getAll
);

// GET /type-devices/counts - Récupérer les types avec compteurs
router.get('/counts', 
  typeDeviceController.getAllTotalsAndDowns
);

// GET /type-devices/:id - Récupérer un type de device par ID
router.get('/:id', 
  typeDeviceMiddleware.validateId,
  typeDeviceController.getById
);

// POST /type-devices - Créer un nouveau type de device
router.post('/', 
  typeDeviceMiddleware.validateCreate,
  typeDeviceController.create
);

// PUT /type-devices/:id - Mettre à jour un type de device
router.put('/:id', 
  typeDeviceMiddleware.validateId,
  typeDeviceMiddleware.validateUpdate,
  typeDeviceController.update
);

// DELETE /type-devices/:id - Supprimer un type de device
router.delete('/:id', 
  typeDeviceMiddleware.validateId,
  typeDeviceController.delete
);

module.exports = router;
