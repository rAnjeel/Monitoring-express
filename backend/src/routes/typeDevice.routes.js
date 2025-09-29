const express = require('express');
const router = express.Router();
const typeDeviceController = require('../controllers/typeDevice.controller');
const validateTypeDevice = require('../middlewares/typeDevice.middleware');

router.get('/', (req, res) => typeDeviceController.getAll(req, res));
router.get('/counts', (req, res) => typeDeviceController.getAllTotalsAndDowns(req, res));
router.get('/:id', (req, res) => typeDeviceController.getById(req, res));
router.post('/', validateTypeDevice, (req, res) => typeDeviceController.create(req, res));
router.put('/:id', validateTypeDevice, (req, res) => typeDeviceController.update(req, res));
router.delete('/:id', (req, res) => typeDeviceController.delete(req, res));

module.exports = router;
