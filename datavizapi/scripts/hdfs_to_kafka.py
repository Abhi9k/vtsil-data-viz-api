import h5py
import json
import os
from confluent_kafka import Consumer
from confluent_kafka import Producer
import datavizapi.cassandra_operations as db_op
from datavizapi import AppConfig

config = AppConfig().getConfig()
daq_name_id_map = {}


def daqNameIdMap():
    if daq_name_id_map:
        return daq_name_id_map
    sensor_info_objects = db_op.getSensorInfoAll()
    for obj in sensor_info_objects:
        daq_name_id_map[obj.daq_name] = obj.id
    return daq_name_id_map


SENSOR_DATE_TIME_FORMAT = '%Y-%m-%d %H:%M:%S:%f'
FILENAME_DATE_FORMAT = config['file_sync']['file_name_format']

p = Producer({
    'bootstrap.servers': ",".join(config['kafka']['servers']),
    'default.topic.config': {'acks': '1'},
    'retries': config['kafka']['producer_h5']['retries'],
    'max.in.flight.requests.per.connection': 1,
    'linger.ms': config['kafka']['producer_h5']['linger_ms']})
c = Consumer({
    'bootstrap.servers': ",".join(config['kafka']['servers']),
    'group.id': config['kafka']['consumer_hdfs']['group'],
    'auto.offset.reset': config['kafka']['consumer_hdfs']['offset']})

c.subscribe([config['kafka']['consumer_hdfs']['topic']])


def delivery_report(err, msg):
    """ Called once for each message produced to indicate delivery result.
        Triggered by poll() or flush(). """
    if err is not None:
        print('Message delivery failed: {}'.format(err))
    else:
        print('Message delivered to {} [{}]'.format(
            msg.topic(), msg.partition()))


def readH5(fname, sample_rate):
    f = h5py.File(fname, 'r')
    data = f['/Data']
    keys = data.keys()
    flattened_data = map(lambda k: (k, data.get(k).value.flatten()), keys)
    f.close()
    return flattened_data


def putRawDataInQueue(ts, data, sample_rate):
    for k, v in data:
        sid = daqNameIdMap()[k[5:]]
        data = v.tolist()
        payload = {
            "ts": ts,
            "daq_name": k[5:],
            "d": data,
            "f": sample_rate,
            "sid": sid
        }
        p.produce(
            "rawData_" + str(sid),
            value=json.dumps(payload))
        p.poll(1)


while True:
    msg = c.poll(1)
    if msg is None:
        continue
    if msg.error():
        print("Consumer error: {}".format(msg.error()))
        continue
    msg = json.loads(msg.value())
    fname = msg['file_name']
    sample_rate = msg['sample_rate']
    ts = fname[:-3]
    os.system('hdfs dfs -copyToLocal /user/vtsil/perftest/{0} ./'.format(fname))
    data = readH5(fname, sample_rate)
    putRawDataInQueue(ts.split('/')[-1], data, sample_rate)
    os.system("rm {0}".format(fname))
