const { mysqlTable, int, text, bigint, varchar, mysqlEnum } = require('drizzle-orm/mysql-core');

const ports = mysqlTable('ports', {
  id: int('id').primaryKey().autoincrement(),
  port_id: int('port_id'),
  device_id: int('device_id').notNull(),
  ifName: text('ifName'),
  ifDescr: text('ifDescr'),
  ifAlias: text('ifAlias'),
  in_octets: bigint('in_octets', { mode: 'number' }).default(0),
  out_octets: bigint('out_octets', { mode: 'number' }).default(0),
  status: mysqlEnum('status', ['up', 'down', 'warning']).notNull(),
  ne_id: varchar('ne_id', { length: 45 }).notNull(),
});

module.exports = { ports };
