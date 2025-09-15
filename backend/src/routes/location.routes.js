const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

router.get('/', locationController.getAll.bind(locationController));
router.get('/:id', locationController.getById.bind(locationController));
router.post('/', locationController.create.bind(locationController));
router.put('/:id', locationController.update.bind(locationController));
router.delete('/:id', locationController.delete.bind(locationController));

module.exports = router;
