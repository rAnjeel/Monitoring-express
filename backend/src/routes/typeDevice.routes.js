const express = require('express');
const router = express.Router();
const typeDeviceController = require('../controllers/typeDevice.controller');
const validateTypeDevice = require('../middlewares/typeDevice.middleware');

router.get('/', typeDeviceController.getAll.bind(typeDeviceController));
router.get('/:id', typeDeviceController.getById.bind(typeDeviceController));
router.post('/', validateTypeDevice, typeDeviceController.create.bind(typeDeviceController));
router.put('/:id', validateTypeDevice, typeDeviceController.update.bind(typeDeviceController));
router.delete('/:id', typeDeviceController.delete.bind(typeDeviceController));

module.exports = router;
