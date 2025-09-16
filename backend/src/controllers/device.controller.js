const logger = require('../logger/logger');
const service = require('../services/device.service');
const DeviceDTO = require('../dtos/device.dto');

class DeviceController {
  async getAll(req, res) {
    try {
      const items = await service.list();
      logger.info(`DeviceController: returning ${items.length} devices`);
      res.json(items);
    } catch (error) {
      logger.error(`DeviceController getAll error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const item = await service.get(req.params.id);
      if (!item.length) {
        logger.warn(`DeviceController: device id=${req.params.id} not found`);
        return res.status(404).json({ message: 'Not found' });
      }
      logger.info(`DeviceController: returning device id=${req.params.id}`);
      res.json(item[0]);
    } catch (error) {
      logger.error(`DeviceController getById error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async create(req, res) {
    try {
      const dto = new DeviceDTO(req.body);
      logger.info(`DeviceController: creating device with data=${JSON.stringify(dto)}`);
      const id = await service.create(dto);
      res.status(201).json({ id });
    } catch (error) {
      logger.error(`DeviceController create error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async update(req, res) {
    try {
      const dto = new DeviceDTO(req.body);
      logger.info(`DeviceController: updating device id=${req.params.id} with data=${JSON.stringify(dto)}`);
      await service.update(req.params.id, dto);
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      logger.error(`DeviceController update error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async delete(req, res) {
    try {
      logger.info(`DeviceController: deleting device id=${req.params.id}`);
      await service.delete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      logger.error(`DeviceController delete error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

module.exports = new DeviceController();
