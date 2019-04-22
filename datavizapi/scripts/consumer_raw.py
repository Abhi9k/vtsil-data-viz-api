from confluent_kafka import Consumer
import sys
sys.path.append('/home/vtsil/vtsil-data-viz-api')
import datavizapi.cassandra_operations as db_op
from datavizapi import AppConfig
import json

config = AppConfig().getConfig()
kafka_config = config['kafka']

c = Consumer({
    'bootstrap.servers': ",".join(kafka_config['servers']),
    'group.id': kafka_config['consumer_raw']['group'],
    'auto.offset.reset': kafka_config['consumer_raw']['offset']})


def getSensorIds():
    sensor_info_objects = db_op.getSensorInfoAll()
    sids = []
    for obj in sensor_info_objects:
        sids.append(str(obj.id))


def startConsumer(topics):
    c.subscribe(topics)
    while True:
        msg = c.poll(1)
        if msg is None:
            continue
        if msg.error():
            print("Consumer error: {}".format(msg.error()))
            continue
        msg_parsed = json.loads(msg.value())
        sid = msg_parsed['sid']
        db_op.insertSensorData(sid, msg['ts'], msg['d'])


if __name__ == '__main__':
    start = int(sys.argv[1])
    end = int(sys.argv[2])
    sids = getSensorIds()
    sids = sids[start:end]
    topics = map(lambda x: 'rawData_' + x, sids)
