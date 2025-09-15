const express = require('express');
const router = express.Router();
const typeDeviceController = require('../controllers/typeDevice.controller');

router.get('/', typeDeviceController.getAll.bind(typeDeviceController));
router.get('/:id', typeDeviceController.getById.bind(typeDeviceController));
router.post('/', typeDeviceController.create.bind(typeDeviceController));
router.put('/:id', typeDeviceController.update.bind(typeDeviceController));
router.delete('/:id', typeDeviceController.delete.bind(typeDeviceController));

module.exports = router;
