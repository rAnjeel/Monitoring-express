const deviceService = require('../services/device.service');

async function getDevices(req, res) {
  const devices = await deviceService.listDevices();
  res.json(devices);
}

async function getDevice(req, res) {
  const device = await deviceService.getDevice(req.params.id);
  if (!device) return res.status(404).json({ message: 'Device not found' });
  res.json(device);
}

async function createDevice(req, res) {
  const id = await deviceService.addDevice(req.body);
  res.status(201).json({ id });
}

async function updateDevice(req, res) {
  await deviceService.modifyDevice(req.params.id, req.body);
  res.json({ message: 'Device updated' });
}

async function deleteDevice(req, res) {
  await deviceService.removeDevice(req.params.id);
  res.json({ message: 'Device deleted' });
}

module.exports = { getDevices, getDevice, createDevice, updateDevice, deleteDevice };
