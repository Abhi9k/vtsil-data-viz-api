from confluent_kafka import Consumer
import datavizapi.cassandra_operations as db_op
from datavizapi import AppConfig
import json

config = AppConfig().getConfig()
kafka_config = config['kafka']

c = Consumer({
    'bootstrap.servers': ",".join(kafka_config['servers']),
    'group.id': kafka_config['consumer_psd']['group'],
    'auto.offset.reset': kafka_config['consumer_psd']['offset']})

c.subscribe([kafka_config['consumer_psd']['topic']])

# def delivery_report(err, msg):
#     """ Called once for each message produced to indicate delivery result.
#         Triggered by poll() or flush(). """
#     if err is not None:
#         print('Message delivery failed: {}'.format(err))
#     else:
#         print('Message delivered to {} [{}]'.format(
#             msg.topic(), msg.partition()))


while True:
    msg = c.poll(1)
    if msg is None:
        continue
    if msg.error():
        print("Consumer error: {}".format(msg.error()))
        continue
    msg = json.loads(msg.value())
    sid = msg['sid']
    db_op.insertSensorData(sid, msg['ts'], msg['d'])
