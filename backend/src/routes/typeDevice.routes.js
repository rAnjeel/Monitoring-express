import express from 'express';
const router = express.Router();
import typeDeviceController from '../controllers/typeDevice.controller.js';
import validateTypeDevice from '../middlewares/typeDevice.middleware.js';

router.get('/', (req, res) => typeDeviceController.getAll(req, res));
router.get('/counts', (req, res) => typeDeviceController.getAllTotalsAndDowns(req, res));
router.get('/:id', (req, res) => typeDeviceController.getById(req, res));
router.post('/', validateTypeDevice, (req, res) => typeDeviceController.create(req, res));
router.put('/:id', validateTypeDevice, (req, res) => typeDeviceController.update(req, res));
router.delete('/:id', (req, res) => typeDeviceController.delete(req, res));

export default router;
