SELECT DISTINCT type_device_id
FROM devices
WHERE type_device_id IS NOT NULL
    AND type_device_id NOT IN (SELECT id FROM type_device);

DELETE FROM devices
WHERE type_device_id IS NOT NULL
    AND type_device_id NOT IN (SELECT id FROM type_device);

ALTER TABLE devices
ADD CONSTRAINT fk_devices_type_device
FOREIGN KEY (type_device_id)
REFERENCES type_device(id)
ON DELETE SET NULL ON UPDATE CASCADE;

--------------------------------------------------------------------------------------------------------------

SELECT COUNT(*) AS invalid_ports
FROM ports
WHERE device_id IS NOT NULL
    AND device_id NOT IN (SELECT id FROM devices);

DELETE FROM ports
WHERE device_id IS NOT NULL
    AND device_id NOT IN (SELECT id FROM devices);

ALTER TABLE ports
ADD CONSTRAINT fk_ports_device
FOREIGN KEY (device_id) REFERENCES devices(id)
ON DELETE CASCADE ON UPDATE CASCADE;

