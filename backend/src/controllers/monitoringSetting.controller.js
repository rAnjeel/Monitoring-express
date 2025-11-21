import monitoringSettingService from '../services/monitoringSetting.service.js';
import logger from '../logger/logger.js';

class MonitoringSettingController {
  getAll = async (req, res) => {
    try {
      const items = await monitoringSettingService.list();
      res.json(items);
    } catch (error) {
      logger.error(`MonitoringSettingController getAll error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  getById = async (req, res) => {
    try {
      const item = await monitoringSettingService.get(req.params.id);
      if (!item.length) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.json(item[0]);
    } catch (error) {
      logger.error(`MonitoringSettingController getById error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  getByKeyName = async (req, res) => {
    try {
      const item = await monitoringSettingService.getByKeyName(req.params.keyName);
      if (!item.length) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.json(item[0]);
    } catch (error) {
      logger.error(`MonitoringSettingController getByKeyName error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  create = async (req, res) => {
    try {
      const id = await monitoringSettingService.create(req.body);
      res.status(201).json({ id });
    } catch (error) {
      logger.error(`MonitoringSettingController create error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  update = async (req, res) => {
    try {
      await monitoringSettingService.update(req.params.id, req.body);
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      logger.error(`MonitoringSettingController update error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  delete = async (req, res) => {
    try {
      await monitoringSettingService.delete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      logger.error(`MonitoringSettingController delete error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

const monitoringSettingController = new MonitoringSettingController();
export default monitoringSettingController;
