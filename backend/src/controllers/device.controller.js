import logger from '../logger/logger.js';
import deviceService from '../services/device.service.js';
import SocketService from '../services/socket/socket.service.js';

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
      // filter attendu comme JSON : { key: 'valeur', type_device: 'switch', location: 'Paris' }
      const filterObj = req.query.filter ? JSON.parse(req.query.filter) : {};
      const items = await deviceService.getFullList(filterObj);
      res.json(items);
    } catch (error) {
      logger.error(`Controller error (getAll): ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  }


  getPage = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const filterObj = req.query.filter ? JSON.parse(req.query.filter) : {};
      logger.info(`page = ${page}, pageSize = ${pageSize}, filter = ${JSON.stringify(filterObj)}`);
      const items = await deviceService.getDevicesPage({ page, pageSize, filter: filterObj });
      res.json(items);
    } catch (error) {
      logger.error(`Controller error (getPage): ${error.message}`);
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
      // Enqueue for bulk socket emit
      SocketService.enqueueDeviceUpdate(req.params.id)
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

export default new DeviceController();
