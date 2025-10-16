import express from 'express';
import deviceController from '../controllers/device.controller.js';
import validateDevice from '../middlewares/device.middleware.js';

const router = express.Router();

router.get('/', (req, res) => deviceController.getAll(req, res));
router.get('/list', (req, res) => deviceController.getList(req, res));
router.get('/limit', (req, res) => deviceController.getPage(req, res));
router.get('/:id/ports', (req, res) => deviceController.getPortsByDevice(req, res));
router.get('/:id', (req, res) => deviceController.getById(req, res));
router.get('/report', (req, res) => deviceController.reportByDeviceAndDateRange(req, res));
router.post('/', validateDevice, (req, res) => deviceController.create(req, res));
router.post('/import', (req, res) => deviceController.importCSV(req, res));
router.put('/:id', validateDevice, (req, res) => deviceController.update(req, res));
router.delete('/:id', (req, res) => deviceController.delete(req, res));

export default router;
