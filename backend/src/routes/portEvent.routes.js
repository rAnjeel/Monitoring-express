import express from 'express';
import portEventController from '../controllers/portEvent.controller.js';

const router = express.Router();

router.get('/:portId', portEventController.getByPortId);
router.delete('/:id', portEventController.delete);

export default router;

