from cassandra.cluster import Cluster
from cassandra.policies import RoundRobinPolicy
from cassandra.cqlengine import columns
from cassandra.cqlengine import connection
from cassandra.cqlengine.models import Model
from datetime import datetime


cluster = Cluster(
        ['node0','node1','node2'],
        load_balancing_policy=RoundRobinPolicy,
        port=9042)

session = cluster.connect('vtsil')
session.default_fetch_size=None
connection.register_connection('VTSIL Cluster', session=session)

class BaseModel(Model):
    __abstract__ = True
    __keyspace__ = 'vtsil'
    __connection__ = 'VTSIL Cluster'


class SensorInfo(BaseModel):
    __table_name__ = 'sensor_info'
    id          = columns.Integer(primary_key=True, partition_key=True)
    floor_num   = columns.Text()
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
    id          = columns.Integer(primary_key=True, partition_key=True)
    date        = columns.DateTime(primary_key=True, partition_key=True)
    ts          = columns.DateTime(primary_key=True, partition_key=False, clustering_order='DESC')
    data        = columns.List(columns.Float())

class PSDByHour(BaseModel):
    __table_name__ = 'psd_by_hour'
    id          = columns.Integer(primary_key=True)
    date        = columns.DateTime(primary_key=True, partition_key=True)
    ts          = columns.DateTime(primary_key=True, partition_key=False, clustering_order='DESC')
    total_power = columns.Float()
    power_dist  = columns.List(columns.Float())

