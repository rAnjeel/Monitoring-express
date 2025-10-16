import express from 'express';
import portController from '../controllers/port.controller.js';
import validatePort from '../middlewares/port.middleware.js';

const router = express.Router();

router.get('/', (req, res) => portController.getAll(req, res));
router.get('/list', (req, res) => portController.getList(req, res));
router.get('/limit', (req, res) => portController.getPage(req, res));
router.get('/:id', (req, res) => portController.getById(req, res));
router.post('/', validatePort, (req, res) => portController.create(req, res));
router.post('/import', (req, res) => portController.importCSV(req, res));
router.put('/:id', validatePort, (req, res) => portController.update(req, res));
router.put('/:id/switch-monitored', (req, res) => portController.switchMonitored(req, res));
router.delete('/:id', (req, res) => portController.delete(req, res));

export default router;

