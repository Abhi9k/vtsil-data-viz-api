DROP TABLE IF EXISTS sensor_metadata;
DROP TABLE IF EXISTS sensor_data;

CREATE TABLE IF NOT EXISTS sensor_metadata (
	id SERIAL,
	daq VARCHAR(20) NOT NULL,
	bias_level VARCHAR(20),
	floor_number VARCHAR(2),
	orientation VARCHAR(2),
	sensitivity VARCHAR(10),
	serial VARCHAR(20),
	x FLOAT(12),
	y FLOAT(12),
	z FLOAT(12),
PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sensor_data (
	id SERIAL,
	daq_id BIGINT UNSIGNED NOT NULL,
	timestamp DATETIME,
	value FLOAT(20),
PRIMARY KEY (id),
FOREIGN KEY (daq_id) REFERENCES sensor_metadata(id)
);

-- """INSERT INTO sensor_metadata (daq,bias_level,floor_number,orientation,sensitivity,serial,x,y,z)
-- 	VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
-- 	[
-- 	('4W-4_04','11.6','4','N','997','41735',-13.561,32.568,13.635)
-- 	]

-- """SELECT id FROM sensor_metadata
-- 	WHERE daq=%s""",('4W-4_04',)

-- """INSERT INTO sensor_data (daq_id,timestamp,value)
-- 	VALUES (%s,%s,%s)""",
-- 	[(1,'2018-11-09 14:25:40',-0.0001242)]