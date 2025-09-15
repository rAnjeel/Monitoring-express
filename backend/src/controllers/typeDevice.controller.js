const typeDeviceService = require('../services/typeDevice.service');
const logger = require('../logger/logger');

class TypeDeviceController {
    async getAll(req, res) {
        try {
        const items = await typeDeviceService.list();
        res.json(items);
        } catch (error) {
        logger.error(`TypeDeviceController getAll error: ${error.message}`);
        res.status(500).json({ message: error.message });
        }
    }

    async getById(req, res) {
        try {
        const item = await typeDeviceService.get(req.params.id);
        if (!item.length) {
            return res.status(404).json({ message: 'TypeDevice not found' });
        }
        res.json(item[0]);
        } catch (error) {
        logger.error(`TypeDeviceController getById error: ${error.message}`);
        res.status(500).json({ message: error.message });
        }
    }

    async create(req, res) {
        try {
        const id = await typeDeviceService.create(req.body);
        res.status(201).json({ id });
        } catch (error) {
        logger.error(`TypeDeviceController create error: ${error.message}`);
        res.status(500).json({ message: error.message });
        }
    }

    async update(req, res) {
        try {
        await typeDeviceService.update(req.params.id, req.body);
        res.json({ message: 'TypeDevice updated successfully' });
        } catch (error) {
        logger.error(`TypeDeviceController update error: ${error.message}`);
        res.status(500).json({ message: error.message });
        }
    }

    async delete(req, res) {
        try {
        await typeDeviceService.delete(req.params.id);
        res.json({ message: 'TypeDevice deleted successfully' });
        } catch (error) {
        logger.error(`TypeDeviceController delete error: ${error.message}`);
        res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new TypeDeviceController();
