import { mysqlTable, int, varchar, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

const monitoringSettings = mysqlTable('monitoring_settings', {
  id: int('id').primaryKey().autoincrement(),
  setting_key: varchar('setting_key', { length: 255 }),
  setting_value: varchar('setting_value', { length: 255 }),
  type: varchar('type', { length: 50 }),
  description: varchar('description', { length: 255 }),
  inserted_date: datetime('inserted_date').default(sql`CURRENT_TIMESTAMP`),
});

export { monitoringSettings };
