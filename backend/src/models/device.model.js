const db = require('../config/db');

async function getAllDevices() {
  const [rows] = await db.query('SELECT * FROM devices');
  return rows;
}

async function getDeviceById(id) {
  const [rows] = await db.query('SELECT * FROM devices WHERE id = ?', [id]);
  return rows[0];
}

async function createDevice(device) {
  const { ip, hostname, status, type_id, location_id, details_id, ne_id } = device;
  const [result] = await db.query(
    `INSERT INTO devices (ip, hostname, status, type_id, location_id, details_id, ne_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ip, hostname, status, type_id, location_id, details_id, ne_id]
  );
  return result.insertId;
}

async function updateDevice(id, device) {
  const { ip, hostname, status, type_id, location_id, details_id, ne_id } = device;
  await db.query(
    `UPDATE devices SET ip=?, hostname=?, status=?, type_id=?, location_id=?, details_id=?, ne_id=? WHERE id=?`,
    [ip, hostname, status, type_id, location_id, details_id, ne_id, id]
  );
}

async function deleteDevice(id) {
  await db.query('DELETE FROM devices WHERE id=?', [id]);
}

module.exports = { getAllDevices, getDeviceById, createDevice, updateDevice, deleteDevice };
