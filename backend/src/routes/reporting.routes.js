import express from 'express';
const router = express.Router();
import reportingController from '../controllers/reporting.controller.js';

// GET /reporting/events-between
router.get('/events-between', reportingController.getEventsBetween);

// GET /reporting/unstable-top10
router.get('/unstable-top10', reportingController.getTop10UnstableDevices);

// GET /reporting/latency-by-day-site
router.get('/latency-by-day-site', reportingController.getAverageLatencyByDayAndSite);

export default router;


