const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const validateLocation = require('../middlewares/location.middleware');

router.get('/', (req, res) => locationController.getAll(req, res));
router.get('/:id', (req, res) => locationController.getById(req, res));
router.post('/', validateLocation, (req, res) => locationController.create(req, res));
router.put('/:id', validateLocation, (req, res) => locationController.update(req, res));
router.delete('/:id', (req, res) => locationController.delete(req, res));

module.exports = router;
