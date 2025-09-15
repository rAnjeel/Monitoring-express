const db = require('../config/db');
const { devices } = require('../models/device.model');
const logger = require('../logger/logger');

class DeviceService {
  async list() {
    logger.info('Fetching all devices');
    return await db.select().from(devices);
  }

  async get(id) {
    logger.info(`Fetching device with id=${id}`);
    return await db.select().from(devices).where(devices.id.eq(id));
  }

  async create(deviceData) {
    logger.info(`Creating device with ip=${deviceData.ip}`);
    const result = await db.insert(devices).values(deviceData);
    return result.insertId;
  }

  async update(id, deviceData) {
    logger.info(`Updating device id=${id}`);
    await db.update(devices).set(deviceData).where(devices.id.eq(id));
  }

  async delete(id) {
    logger.info(`Deleting device id=${id}`);
    await db.delete(devices).where(devices.id.eq(id));
  }
}

module.exports = new DeviceService();
