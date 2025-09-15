const { mysqlTable, int, varchar, double, datetime } = require('drizzle-orm/mysql-core');
const { sql } = require('drizzle-orm');

const locations = mysqlTable('locations', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  lat: double('lat', { precision: 10, scale: 6 }),
  lng: double('lng', { precision: 10, scale: 6 }),
  inserted_date: datetime('inserted_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

module.exports = { locations };
