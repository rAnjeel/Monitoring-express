const { mysqlTable, int, varchar, float, boolean, datetime, text } = require('drizzle-orm/mysql-core');

const devices = mysqlTable('devices', {
  device_id: int('device_id'),
  id: int('id').primaryKey().autoincrement(),
  ip: varchar('ip', { length: 30 }).notNull(),
  hostname: varchar('hostname', { length: 50 }).notNull(),
  status: int('status'),
  type_device_id: int('type_device_id'),
  location_id: int('location_id'),
  codesite: varchar('codesite', { length: 45 }),
  loss: float('loss'),
  avg: float('avg').default(0),
  min: float('min').default(0),
  max: float('max').default(0),
  uptime: datetime('uptime'),
  snmp_disabled: boolean('snmp_disabled').default(false),
  community: text('community'),
  authlevel: text('authlevel'),
  authname: text('authname'),
  authpass: text('authpass'),
  authalgo: text('authalgo'),
  cryptopass: text('cryptopass'),
  cryptoalgo: text('cryptoalgo'),
  snmpver: text('snmpver'),
  ne_id: varchar('ne_id', { length: 45 }).notNull(),
});

module.exports = { devices };
