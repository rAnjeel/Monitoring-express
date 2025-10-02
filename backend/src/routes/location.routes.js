const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const locationMiddleware = require('../middlewares/location.middleware');

// Routes pour les locations

// GET /locations - Récupérer toutes les locations
router.get('/', 
  locationMiddleware.validateQuery,
  locationController.getAll
);

// GET /locations/:id - Récupérer une location par ID
router.get('/:id', 
  locationMiddleware.validateId,
  locationController.getById
);

// POST /locations - Créer une nouvelle location
router.post('/', 
  locationMiddleware.validateCreate,
  locationController.create
);

// PUT /locations/:id - Mettre à jour une location
router.put('/:id', 
  locationMiddleware.validateId,
  locationMiddleware.validateUpdate,
  locationController.update
);

// DELETE /locations/:id - Supprimer une location
router.delete('/:id', 
  locationMiddleware.validateId,
  locationController.delete
);

module.exports = router;
