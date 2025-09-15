const locationService = require('../services/location.service');
const logger = require('../logger/logger');

class LocationController {
  async getAll(req, res) {
    try {
      const items = await locationService.list();
      res.json(items);
    } catch (error) {
      logger.error(`LocationController getAll error: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const item = await locationService.get(req.params.id);
      if (!item.length) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(item[0]);
    } catch (error) {
      logger.error(`LocationController getById error: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async create(req, res) {
    try {
      const id = await locationService.create(req.body);
      res.status(201).json({ id });
    } catch (error) {
      logger.error(`LocationController create error: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      await locationService.update(req.params.id, req.body);
      res.json({ message: 'Location updated successfully' });
    } catch (error) {
      logger.error(`LocationController update error: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await locationService.delete(req.params.id);
      res.json({ message: 'Location deleted successfully' });
    } catch (error) {
      logger.error(`LocationController delete error: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new LocationController();
