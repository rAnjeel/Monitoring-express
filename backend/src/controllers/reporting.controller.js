import logger from '../logger/logger.js';
import reportingService from '../services/reporting.service.js';

class ReportingController {
  // GET /reporting/events-between?start_date=...&end_date=...&status=down&device_id=123
  getEventsBetween = async (req, res) => {
    try {
      const { start_date, end_date, status, device_id, type_device } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({ message: 'start_date and end_date are required' });
      }

      const rows = await reportingService.reportAllDevicesByDateRange({
        start_date,
        end_date,
        status,
        device_id,
        type_device,
      });

      res.json({ rows, count: rows?.length || 0 });
    } catch (error) {
      logger.error(`[ReportingController] Error in getEventsBetween: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // GET /reporting/unstable-top10
  getTop10UnstableDevices = async (req, res) => {
    try {
      const { type_device } = req.query;
      const rows = await reportingService.getTop10UnstableDevices({ type_device });
      res.json({ rows });
    } catch (error) {
      logger.error(`[ReportingController] Error in getTop10UnstableDevices: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };

  // GET /reporting/latency-by-day-site
  getAverageLatencyByDayAndSite = async (req, res) => {
    try {
      const { type_device } = req.query;
      const rows = await reportingService.getAverageLatencyByDayAndSite({ type_device });
      res.json({ rows });
    } catch (error) {
      logger.error(`[ReportingController] Error in getAverageLatencyByDayAndSite: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  };
}

export default new ReportingController();


