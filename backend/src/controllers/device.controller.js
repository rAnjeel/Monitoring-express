const deviceService = require('../services/device.service');

class DeviceController {
  async getAll(req, res) {
    const devices = await deviceService.list();
    res.json(devices);
  }

  async getById(req, res) {
    const device = await deviceService.get(req.params.id);
    if (!device.length) return res.status(404).json({ message: 'Device not found' });
    res.json(device[0]);
  }

  async create(req, res) {
    const id = await deviceService.create(req.body);
    res.status(201).json({ id });
  }

  async update(req, res) {
    await deviceService.update(req.params.id, req.body);
    res.json({ message: 'Device updated' });
  }

  async delete(req, res) {
    await deviceService.delete(req.params.id);
    res.json({ message: 'Device deleted' });
  }
}

module.exports = new DeviceController();
