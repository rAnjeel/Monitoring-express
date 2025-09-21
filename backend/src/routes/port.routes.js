const express = require('express');
const portController = require('../controllers/port.controller');
const validatePort = require('../middlewares/port.middleware');

const router = express.Router();

router.get('/', (req, res) => portController.getAll(req, res));
router.get('/:id', (req, res) => portController.getById(req, res));
router.post('/', validatePort, (req, res) => portController.create(req, res));
router.post('/import', (req, res) => portController.importCSV(req, res));
router.put('/:id', validatePort, (req, res) => portController.update(req, res));
router.delete('/:id', (req, res) => portController.delete(req, res));

module.exports = router;

