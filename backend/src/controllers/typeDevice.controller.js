import typeDeviceService from '../services/typeDevice.service.js';
import logger from '../logger/logger.js';
import TypeDeviceDTO from '../dto/typeDevice.dto.js';

class TypeDeviceController {
  getAll = async (req, res) => {
    try {
      const items = await typeDeviceService.list();
      logger.info(`TypeDeviceController: returning ${items.length} type_devices`);
      res.json(items);
    } catch (error) {
      logger.error(`TypeDeviceController getAll error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  getAllTotalsAndDowns = async (req, res) => {
    try {
      const items = await typeDeviceService.getTypeDeviceCounts();
      logger.info(`TypeDeviceController: returning ${items.length} type_devices with counts`);
      res.json(items);
    } catch (error) {
      logger.error(`TypeDeviceController getAllTotalsAndDowns error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  getById = async (req, res) => {
    try {
      const item = await typeDeviceService.get(req.params.id);
      if (!item.length) {
        logger.warn(`TypeDeviceController: type_device id=${req.params.id} not found`);
        return res.status(404).json({ message: 'Not found' });
      }
      logger.info(`TypeDeviceController: returning type_device id=${req.params.id}`);
      res.json(item[0]);
    } catch (error) {
      logger.error(`TypeDeviceController getById error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  create = async (req, res) => {
    try {
      const dto = new TypeDeviceDTO(req.body);
      logger.info(`TypeDeviceController: creating type_device with data=${JSON.stringify(dto)}`);
      const id = await typeDeviceService.create(dto);
      res.status(201).json({ id });
    } catch (error) {
      logger.error(`TypeDeviceController create error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  update = async (req, res) => {
    try {
      const dto = new TypeDeviceDTO(req.body);
      logger.info(`TypeDeviceController: updating type_device id=${req.params.id} with data=${JSON.stringify(dto)}`);
      await typeDeviceService.update(req.params.id, dto);
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      logger.error(`TypeDeviceController update error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  delete = async (req, res) => {
    try {
      logger.info(`TypeDeviceController: deleting type_device id=${req.params.id}`);
      await typeDeviceService.delete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      logger.error(`TypeDeviceController delete error: ${error.message}`);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

export default new TypeDeviceController();
