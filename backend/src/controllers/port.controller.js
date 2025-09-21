const logger = require('../logger/logger');
const portService = require('../services/port.service');

class PortController {
  getAll = async (req, res) => {
    try {
      const items = await portService.list();
      res.json(items);
    } catch (error) {
      logger.error(`Controller error (getAll ports): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  getById = async (req, res) => {
    try {
      const item = await portService.get(req.params.id);
      if (!item.length) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.json(item[0]);
    } catch (error) {
      logger.error(`Controller error (getById port): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  create = async (req, res) => {
    try {
      const id = await portService.create(req.body);
      res.status(201).json({ id });
    } catch (error) {
      logger.error(`Controller error (create port): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  update = async (req, res) => {
    try {
      await portService.update(req.params.id, req.body);
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      logger.error(`Controller error (update port): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  delete = async (req, res) => {
    try {
      await portService.delete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      logger.error(`Controller error (delete port): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new PortController();

