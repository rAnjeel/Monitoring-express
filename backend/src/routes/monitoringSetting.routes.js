import express from 'express';
const router = express.Router();
import monitoringSettingController from '../controllers/monitoringSetting.controller.js';

router.get('/', (req, res) => monitoringSettingController.getAll(req, res));
router.get('/:id', (req, res) => monitoringSettingController.getById(req, res));
router.get('/key/:keyName', (req, res) => monitoringSettingController.getByKeyName(req, res));
router.post('/', (req, res) => monitoringSettingController.create(req, res));
router.put('/:id', (req, res) => monitoringSettingController.update(req, res));
router.delete('/:id', (req, res) => monitoringSettingController.delete(req, res));

export default router;
