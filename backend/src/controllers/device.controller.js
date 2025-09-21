const logger = require('../logger/logger');
const deviceService = require('../services/device.service');

class DeviceController {
  getAll = async (req, res) => {
    try {
      const items = await deviceService.list();
      res.json(items);
    } catch (error) {
      logger.error(`Controller error (getAll): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  getList = async (req, res) => {
    try {
      const items = await deviceService.getFullList();
      res.json(items);
    } catch (error) {
      logger.error(`Controller error (getAll): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  getById = async (req, res) => {
    try {
      const item = await deviceService.get(req.params.id);
      if (!item.length) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.json(item[0]);
    } catch (error) {
      logger.error(`Controller error (getById): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  create = async (req, res) => {
    try {
      const id = await deviceService.create(req.body);
      res.status(201).json({ id });
    } catch (error) {
      logger.error(`Controller error (create): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  update = async (req, res) => {
    try {
      await deviceService.update(req.params.id, req.body);
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      logger.error(`Controller error (update): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  delete = async (req, res) => {
    try {
      await deviceService.delete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      logger.error(`Controller error (delete): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  importCSV = async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Payload must be an array of rows' });
      }
      const result = await deviceService.importDataCSV(req.body);
      logger.info(`Import processed ${result.createdOrUpdated}/${result.count} rows`);

      res.json({
        message: `Import terminé: ${result.createdOrUpdated}/${result.count} lignes`,
        count: result.count,
        createdOrUpdated: result.createdOrUpdated,
        successHostnames: result.successHostnames,
        errorHostnames: result.errorHostnames,
        errors: result.errors,
      });
    } catch (error) {
      logger.error(`Import error: ${error.message}`);
      res.status(500).json({ message: 'Error importing devices', error: error.message });
    }
  }
}

module.exports = new DeviceController();
