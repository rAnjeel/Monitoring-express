SELECT
  d.device_id,
  d.id,
  d.ip,
  d.hostname,
  d.status,
  d.codesite,
  d.loss,
  d.avg,
  d.min,
  d.max,
  d.uptime,
  d.snmp_disabled,
  d.community,
  d.authlevel,
  d.authname,
  d.authpass,
  d.authalgo,
  d.cryptopass,
  d.cryptoalgo,
  d.snmpver,
  d.ne_id,
  td.name  AS type_name,
  l.name   AS location_name
FROM devices d
LEFT JOIN type_device td ON td.id = d.type_device_id
LEFT JOIN locations   l  ON l.id  = d.location_id;