const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const validateDevice = require('../middlewares/device.middleware');

router.get('/', deviceController.getAll.bind(deviceController));
router.get('/:id', deviceController.getById.bind(deviceController));
router.post('/', validateDevice, deviceController.create.bind(deviceController));
router.put('/:id', validateDevice, deviceController.update.bind(deviceController));
router.delete('/:id', deviceController.delete.bind(deviceController));

module.exports = router;
