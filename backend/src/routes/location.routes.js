import express from 'express';
const router = express.Router();
import locationController from '../controllers/location.controller.js';
import validateLocation from '../middlewares/location.middleware.js';

router.get('/', (req, res) => locationController.getAll(req, res));
router.get('/:id', (req, res) => locationController.getById(req, res));
router.post('/', validateLocation, (req, res) => locationController.create(req, res));
router.put('/:id', validateLocation, (req, res) => locationController.update(req, res));
router.delete('/:id', (req, res) => locationController.delete(req, res));

export default router;
