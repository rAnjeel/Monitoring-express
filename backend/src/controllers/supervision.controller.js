import supervisionPm2Service from '../services/supervisionPm2.service.js';
import logger from '../logger/logger.js';

class SupervisionController {
    start = async (req, res) => {
        try {
            const { pingInstances, trafficInstances } = req.body || {};
            const result = await supervisionPm2Service.startSupervision({ pingInstances, trafficInstances });
            res.json({ message: 'Supervision started', ...result });
        } catch (error) {
            logger.error(`[SupervisionController] Error starting supervision: ${error.message}`);
            res.status(500).json({ message: 'Failed to start supervision', error: error.message });
        }
    };

    stop = async (req, res) => {
        try {
            const result = await supervisionPm2Service.stopSupervision();
            res.json({ message: 'Supervision stopped', ...result });
        } catch (error) {
            logger.error(`[SupervisionController] Error stopping supervision: ${error.message}`);
            res.status(500).json({ message: 'Failed to stop supervision', error: error.message });
        }
    };

    status = async (req, res) => {
        try {
            const result = await supervisionPm2Service.getStatus();
            res.json(result);
        } catch (error) {
            logger.error(`[SupervisionController] Error getting supervision status: ${error.message}`);
            res.status(500).json({ message: 'Failed to get supervision status', error: error.message });
        }
    };
}

const supervisionController = new SupervisionController();
export default supervisionController;
