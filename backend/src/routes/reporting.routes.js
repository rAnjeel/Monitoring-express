import express from 'express';
const router = express.Router();
import reportingController from '../controllers/reporting.controller.js';

router.get('/events-between', reportingController.getEventsBetween);
router.get('/unstable-top10', reportingController.getTop10UnstableDevices);
router.get('/latency-by-day-site', reportingController.getAverageLatencyByDayAndSite);
router.get('/device-stability-status', reportingController.getDeviceStabilityStatus);

export default router;


