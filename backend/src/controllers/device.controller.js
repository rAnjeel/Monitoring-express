const logger = require('../logger/logger');
const deviceService = require('../services/device.service');
const service = require('../services/device.service')

class DeviceController {
  async getAll(req, res) {
    try {
      const items = await service.list();
      res.json(items);
    } catch (error) {
      logger.error(`Controller error (getAll): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async getList(req, res) {
    try {
      const items = await service.getFullList();
      res.json(items);
    } catch (error) {
      logger.error(`Controller error (getAll): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const item = await service.get(req.params.id);
      if (!item.length) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.json(item[0]);
    } catch (error) {
      logger.error(`Controller error (getById): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async create(req, res) {
    try {
      const id = await service.create(req.body);
      res.status(201).json({ id });
    } catch (error) {
      logger.error(`Controller error (create): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      await service.update(req.params.id, req.body);
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      logger.error(`Controller error (update): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await service.delete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      logger.error(`Controller error (delete): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async importCSV(req, res) {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Payload must be an array of rows' });
      }
      logger.info('Received CSV import payload:', req.body); 
      const count = await deviceService.importDataCSV(req.body);
      logger.info(`Successfully imported ${count} devices`);

      res.json({ message: `Imported ${count} devices successfully` });
    } catch (error) {
      logger.error(`Import error: ${error.message}`);
      res.status(500).json({ message: 'Error importing devices', error: error.message });
    }
  }
}

module.exports = new DeviceController();
