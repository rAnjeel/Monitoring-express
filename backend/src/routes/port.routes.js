const express = require('express');
const controller = require('../controllers/port.controller');
const validatePort = require('../middlewares/port.middleware');

const router = express.Router();

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', validatePort, (req, res) => controller.create(req, res));
router.put('/:id', validatePort, (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

module.exports = router;

