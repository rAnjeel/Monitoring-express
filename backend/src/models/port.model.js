const { mysqlTable, int, text, bigint, varchar, boolean } = require('drizzle-orm/mysql-core');

const ports = mysqlTable('ports', {
  id: int('id').primaryKey().autoincrement(),
  port_id: int('port_id'),
  device_id: int('device_id').notNull(),
  ifName: text('ifName'),
  ifDescr: text('ifDescr'),
  ifAlias: text('ifAlias'),
  ifInOctets: bigint('ifInOctets', { mode: 'number' }),
  ifOutOctets: bigint('ifOutOctets', { mode: 'number' }),
  ifOperStatus: varchar('ifOperStatus', { length: 45 }),
  ifAdminStatus: varchar('ifAdminStatus', { length: 45 }),
  ifMtu: int('ifMtu'),
  ifType: varchar('ifType', { length: 45 }),
  ifPhysAddress: varchar('ifPhysAddress', { length: 45 }),
  ifLastChange: int('ifLastChange'),
  ifHighSpeed: int('ifHighSpeed'),
  ifPromiscuousMode: boolean('ifPromiscuousMode'),
  ifConnectorPresent: boolean('ifConnectorPresent'),
  ifSpeed: int('ifSpeed'),
  ifIndex: int('ifIndex'),
  ne_id: varchar('ne_id', { length: 45 }).notNull(),
});

module.exports = { ports };
