import { mysqlTable, int, varchar, double, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

const locations = mysqlTable('locations', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  lat: double('lat', { precision: 10, scale: 6 }),
  lng: double('lng', { precision: 10, scale: 6 }),
  inserted_date: datetime('inserted_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export { locations };
