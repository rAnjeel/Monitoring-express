const { mysqlTable, int, varchar } = require('drizzle-orm/mysql-core');

const typeDevices = mysqlTable('type_device', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
});

module.exports = { typeDevices };
