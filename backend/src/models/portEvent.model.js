import { mysqlTable, int, bigint, mysqlEnum, datetime } from 'drizzle-orm/mysql-core';

const portEvents = mysqlTable('port_events', {
  id: int('id').primaryKey().autoincrement(),
  port_id: int('port_id').notNull(),
  ifInOctets: bigint('ifInOctets', { mode: 'number' }).default(0),
  ifOutOctets: bigint('ifOutOctets', { mode: 'number' }).default(0),
  status: mysqlEnum('status', ['up', 'down', 'warning']).notNull(),
  event_time: datetime('event_time'),
});

export { portEvents };

