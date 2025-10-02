const express = require('express');
const router = express.Router();
const portController = require('../controllers/port.controller');
const portMiddleware = require('../middlewares/port.middleware');

// Routes pour les ports

// GET /ports - Récupérer tous les ports (simple)
router.get('/', 
  portController.getAll
);

// GET /ports/list - Récupérer tous les ports avec filtres
router.get('/list', 
  portMiddleware.validateQuery,
  portController.getList
);

// GET /ports/limit - Récupérer les ports avec pagination
router.get('/limit', 
  portMiddleware.validateQuery,
  portController.getPage
);

// GET /ports/:id - Récupérer un port par ID
router.get('/:id', 
  portMiddleware.validateId,
  portController.getById
);

// POST /ports - Créer un nouveau port
router.post('/', 
  portMiddleware.validateCreate,
  portController.create
);

// POST /ports/import - Importer des ports depuis CSV
router.post('/import', 
  portMiddleware.validateImportCSV,
  portController.importCSV
);

// PUT /ports/:id - Mettre à jour un port
router.put('/:id', 
  portMiddleware.validateId,
  portMiddleware.validateUpdate,
  portController.update
);

// DELETE /ports/:id - Supprimer un port
router.delete('/:id', 
  portMiddleware.validateId,
  portController.delete
);

module.exports = router;

