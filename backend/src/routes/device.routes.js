const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');

router.get('/', deviceController.getDevices);
router.get('/:id', deviceController.getDevice);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
