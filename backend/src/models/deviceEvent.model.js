const { mysqlTable, int, float, mysqlEnum, timestamp } = require('drizzle-orm/mysql-core');

const deviceEvents = mysqlTable('device_events', {
  id: int('id').primaryKey().autoincrement(),
  device_id: int('device_id').notNull(),
  loss: float('loss'),
  avg: float('avg').default(0),
  min: float('min').default(0),
  max: float('max').default(0),
  status: mysqlEnum('status', ['up', 'down', 'warning']).notNull(),
  event_time: timestamp('event_time').defaultNow(),
});

module.exports = { deviceEvents };
