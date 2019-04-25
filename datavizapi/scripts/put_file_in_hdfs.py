import os
import json
from confluent_kafka import Consumer, Producer
import ftp_operations as f_ops
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


def fetchFileFTP(fname):
    ftp = f_ops.connectAndGetFTP()
    ftp.cwd(config['file_sync']['remote_folder'])
    f_ops.fetchFiles(ftp, [fname])


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

    fetchFileFTP(fname)

    os.system("hdfs dfs -copyFromLocal {0} /user/vtsil/testfiles/".format(fname))

    payload = {
        'file_name': fname,
        'sample_rate': sample_rate
    }
    os.system("rm {0}".format(fname))
    p.produce(
        config['kafka']['consumer_hdfs']['topic'],
        json.dumps(payload))
    p.poll(1)

# import json, os, time
# from confluent_kafka import Producer

# fnames = os.listdir('test_input')

# fnames = sorted(fnames)
# fnames = fnames[1]
# p = Producer({'bootstrap.servers': 'node0,node1,node2'})

# payload = {'sample_rate': 1024, 'file_name': ''}

# for fname in fnames:
#     payload['file_name'] = fname
#     p.produce('putHdfs', json.dumps(payload))
#     p.poll(1)
#     time.sleep(0.3)
