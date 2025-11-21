import express from 'express';
const router = express.Router();
import reportingController from '../controllers/reporting.controller.js';

router.get('/events-between', reportingController.getEventsBetween);
router.get('/unstable-top10', reportingController.getTop10UnstableDevices);
router.get('/inventory-summary', reportingController.getInventorySummary);
router.get('/devices-by-type', reportingController.getDevicesByType);
router.get('/devices-by-location', reportingController.getDevicesByLocation);
router.get('/latency-by-day-site', reportingController.getAverageLatencyByDayAndSite);
router.get('/latency-by-day', reportingController.getAverageLatencyByDay);
router.get('/device-stability-status', reportingController.getDeviceStabilityStatus);
router.get('/today-summary', reportingController.getTodayEventsSummary);
router.get('/availability/:device_id', reportingController.getAvailability);
router.get('/mtbf/:device_id', reportingController.getMTBF);

export default router;


