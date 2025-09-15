const deviceModel = require('../models/device.model');

async function listDevices() {
  return deviceModel.getAllDevices();
}

async function getDevice(id) {
  return deviceModel.getDeviceById(id);
}

async function addDevice(deviceData) {
  return deviceModel.createDevice(deviceData);
}

async function modifyDevice(id, deviceData) {
  return deviceModel.updateDevice(id, deviceData);
}

async function removeDevice(id) {
  return deviceModel.deleteDevice(id);
}

module.exports = { listDevices, getDevice, addDevice, modifyDevice, removeDevice };
