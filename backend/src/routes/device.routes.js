const express = require('express');

const router = express.Router();
const deviceController = require('../controllers/device.controller');
const validateDevice = require('../middlewares/device.middleware');

router.get('/', (req, res) => deviceController.getAll(req, res));
router.get('/list', (req, res) => deviceController.getList(req, res));
router.get('/limit', (req, res) => deviceController.getPage(req, res));
router.get('/:id', (req, res) => deviceController.getById(req, res));
router.post('/', validateDevice, (req, res) => deviceController.create(req, res));
router.post('/import', (req, res) => deviceController.importCSV(req, res));
router.put('/:id', validateDevice, (req, res) => deviceController.update(req, res));
router.delete('/:id', (req, res) => deviceController.delete(req, res));

module.exports = router;
