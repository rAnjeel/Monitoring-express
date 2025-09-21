require('dotenv').config();
const mysql = require('mysql2/promise');
const { drizzle } = require('drizzle-orm/mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'rabearison21',
  // password: process.env.DB_PASS || 'R@bearison21',
  database: process.env.DB_NAME || 'monitoring',
});

const db = drizzle(pool , { logger: true });

module.exports = db;
