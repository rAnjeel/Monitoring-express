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

-- Check doublons
SELECT
    port_id,
    COUNT(port_id) AS NombreDoublons
FROM
    ports
GROUP BY
    port_id
HAVING
    COUNT(port_id) > 1
ORDER BY
    NombreDoublons DESC;

-- Effacer doublons
DELETE p1
FROM
    ports p1
INNER JOIN (
    SELECT
        MIN(id) AS min_id,
        port_id
    FROM
        ports
    GROUP BY
        port_id
    HAVING
        COUNT(port_id) > 1
) AS doublons ON p1.port_id = doublons.port_id
WHERE
    p1.id > doublons.min_id;


SELECT
    p1.port_id 
FROM
    ports p1
INNER JOIN (
    -- La sous-requête reste la même
    SELECT MIN(id) AS min_id, port_id FROM ports GROUP BY port_id HAVING COUNT(port_id) > 1
) AS doublons ON p1.port_id = doublons.port_id
WHERE
    p1.id > doublons.min_id;

--Reset commit git
git reset --soft HEAD~2