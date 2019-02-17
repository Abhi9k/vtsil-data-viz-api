CREATE KEYSPACE IF NOT EXISTS vtsil
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

use vtsil;

CREATE TABLE IF NOT EXISTS sensor_info (
	id int,
	floor_num text,
	orientation text,
	bias_level text,
	sensitivity text,
	serial_num text,
	daq_name text,
	x_pos text,
	y_pos text,
	z_pos text,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sensor_data_by_hour (
	id int,
	date timestamp,
	ts timestamp,
	data FROZEN <LIST<float>>,
	PRIMARY KEY ((id, date), ts)
) WITH CLUSTERING ORDER BY (ts DESC) AND
 	   caching = { 
		 'keys' : 'NONE', 
		 'rows_per_partition' : 'NONE' } AND
       memtable_flush_period_in_ms = '6000' AND
       compaction = { 
		   'class' : 'DateTieredCompactionStrategy' };

CREATE TABLE IF NOT EXISTS psd_by_hour (
	id int,
	date timestamp,
	ts timestamp,
	total_power float,
	power_dist FROZEN <LIST<float>>,
	PRIMARY KEY ((id, date), ts)
)
 WITH CLUSTERING ORDER BY (ts DESC) AND
	caching = { 
	 'keys' : 'NONE', 
	 'rows_per_partition' : 'NONE' } AND
   memtable_flush_period_in_ms = '6000' AND
   compaction = { 
	   'class' : 'DateTieredCompactionStrategy' };

