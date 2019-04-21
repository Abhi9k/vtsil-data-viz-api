import os
import json
from confluent_kafka import Consumer, Producer
from datavizapi import AppConfig

config = AppConfig().getConfig()

p = Producer({
    'bootstrap.servers': ','.join(config['kafka']['servers']),
    'default.topic.config': {'acks': '1'},
    'retries': config['kafka']['producer_hdfs']['retries'],
    'max.in.flight.requests.per.connection': config['kafka']['producer_hdfs']['max_in_flight']})

c = Consumer({
    'bootstrap.servers': ','.join(config['kafka']['servers']),
    'group.id': config['kafka']['consumer_h5']['group'],
    'auto.offset.reset': config['kafka']['consumer_h5']['offset']})

c.subscribe([config['kafka']['consumer_h5']['topic']])

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
    os.system("hdfs dfs -copyFromLocal {0} /user/vtsil/perftest/".format(fname))

    payload = {
        'file_name': os.path.split(fname)[-1],
        'sample_rate': sample_rate
    }
    p.produce(
        config['kafka']['consumer_hdfs']['topic'],
        json.dumps(payload))
    p.poll(1)
