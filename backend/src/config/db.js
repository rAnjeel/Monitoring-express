const mysql = require('mysql2/promise');
const { drizzle } = require('drizzle-orm/mysql2');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const db = drizzle(pool , { logger: true });

module.exports = db;
