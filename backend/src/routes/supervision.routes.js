import express from 'express';
import supervisionController from '../controllers/supervision.controller.js';

const router = express.Router();

router.post('/start', (req, res) => supervisionController.start(req, res));
router.post('/stop', (req, res) => supervisionController.stop(req, res));
router.get('/status', (req, res) => supervisionController.status(req, res));

export default router;
