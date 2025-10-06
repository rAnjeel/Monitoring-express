import { mysqlTable, int, varchar } from 'drizzle-orm/mysql-core';

const typeDevices = mysqlTable('type_device', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
});

export { typeDevices };
