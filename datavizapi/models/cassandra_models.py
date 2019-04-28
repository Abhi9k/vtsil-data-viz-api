from cassandra.cluster import Cluster
from cassandra.policies import RoundRobinPolicy
from cassandra.cqlengine import columns
from cassandra.cqlengine import connection
from cassandra.cqlengine.models import Model
from datavizapi import AppConfig

config = AppConfig().getConfig()

cluster = Cluster(
    config['cassandra']['nodes'],
    load_balancing_policy=RoundRobinPolicy(),
    port=config['cassandra']['port'])

session = cluster.connect(config['cassandra']['keyspace'])
session.default_fetch_size = None
session.default_timeout = 60.0
connection.register_connection('VTSIL Cluster', session=session)


class BaseModel(Model):
    __abstract__ = True
    __keyspace__ = config['cassandra']['keyspace']
    __connection__ = 'VTSIL Cluster'


class SensorInfo(BaseModel):
    __table_name__ = 'sensor_info'
    id          = columns.Integer(primary_key=True, partition_key=True)
    floor_num   = columns.Text()
    name        = columns.Text()
    orientation = columns.Text()
    bias_level  = columns.Text()
    sensitivity = columns.Text()
    serial_num  = columns.Text()
    daq_name    = columns.Text()
    x_pos       = columns.Text()
    y_pos       = columns.Text()
    z_pos       = columns.Text()


class SensorDataByHour(BaseModel):
    __table_name__ = 'sensor_data_by_hour'
    date        = columns.DateTime(primary_key=True, partition_key=True)
    ts          = columns.DateTime(primary_key=True, partition_key=False, clustering_order='DESC')
    id          = columns.Integer(primary_key=True, partition_key=False)
    data        = columns.List(columns.Float())


class PSDByHour(BaseModel):
    __table_name__ = 'psd_by_hour'
    date        = columns.DateTime(primary_key=True, partition_key=True)
    ts          = columns.DateTime(primary_key=True, partition_key=False, clustering_order='DESC')
    id          = columns.Integer(primary_key=True, partition_key=False)
    total_power = columns.Float()
    power_dist  = columns.List(columns.Float())
