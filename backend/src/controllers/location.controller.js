const locationService = require('../services/location.service');
const logger = require('../logger/logger');
const LocationDTO = require('../dto/location.dto');

class LocationController {
  getAll = async (req, res) => {
    try {
      const items = await locationService.list();
      logger.info(`LocationController: returning ${items.length} locations`);
      res.json(items);
    } catch (error) {
      logger.error(`LocationController getAll error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  getById = async (req, res) => {
    try {
      const item = await locationService.get(req.params.id);
      if (!item.length) {
        logger.warn(`LocationController: location id=${req.params.id} not found`);
        return res.status(404).json({ message: 'Not found' });
      }
      logger.info(`LocationController: returning location id=${req.params.id}`);
      res.json(item[0]);
    } catch (error) {
      logger.error(`LocationController getById error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  create = async (req, res) => {
    try {
      const dto = new LocationDTO(req.body);
      logger.info(`LocationController: creating location with data=${JSON.stringify(dto)}`);
      const id = await locationService.create(dto);
      res.status(201).json({ id });
    } catch (error) {
      logger.error(`LocationController create error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  update = async (req, res) => {
    try {
      const dto = new LocationDTO(req.body);
      logger.info(`LocationController: updating location id=${req.params.id} with data=${JSON.stringify(dto)}`);
      await locationService.update(req.params.id, dto);
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      logger.error(`LocationController update error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  delete = async (req, res) => {
    try {
      logger.info(`LocationController: deleting location id=${req.params.id}`);
      await locationService.delete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      logger.error(`LocationController delete error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

module.exports = new LocationController();
