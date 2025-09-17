const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const validateLocation = require('../middlewares/location.middleware');

router.get('/', locationController.getAll.bind(locationController));
router.get('/:id', locationController.getById.bind(locationController));
router.post('/', validateLocation, locationController.create.bind(locationController));
router.put('/:id', validateLocation, locationController.update.bind(locationController));
router.delete('/:id', locationController.delete.bind(locationController));

module.exports = router;
