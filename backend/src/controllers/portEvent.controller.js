import logger from '../logger/logger.js';
import portEventService from '../services/portEvent.service.js';

class PortEventController {
  getByPortId = async (req, res) => {
    try {
        const { portId } = req.params;
        const { page, pageSize, status, start_date, end_date } = req.query;
        const result = await portEventService.getByPortId(portId, { page, pageSize, status, start_date, end_date });
        res.json(result);
        logger.info(`[PortEventController] getByPortId success: ${JSON.stringify(result)}`);
    } catch (error) {
        logger.error(`[PortEventController] getByPortId error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
  }

  delete = async (req, res) => {
    try {
        const { id } = req.params;
        await portEventService.delete(id);
        res.json({ message: 'Deleted successfully' });
        logger.info(`[PortEventController] delete success: ${id}`);
    } catch (error) {
        logger.error(`[PortEventController] delete error: ${error.message}`)
        res.status(500).json({ message: error.message })
    }
  }
}

export default new PortEventController();

