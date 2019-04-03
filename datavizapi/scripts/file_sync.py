import os
import time
import json
import ftp_operations as f_ops
from confluent_kafka import Producer
from datavizapi import AppConfig

config = AppConfig.getConfig()

p = Producer({'bootstrap.servers': ",".join(config['kafka']['servers'])})

SCRIPT_BASE_PATH = os.path.dirname(os.path.realpath(__file__))


def delivery_report(err, msg):
    """ Called once for each message produced to indicate delivery result.
        Triggered by poll() or flush(). """
    if err is not None:
        print('Message delivery failed: {}'.format(err))
    else:
        print('Message delivered to {} [{}]'.format(
            msg.topic(), msg.partition()))


def parseSampleRateFromConfig(fname):
    sample_rate = None
    with open(fname, 'r') as f:
        lines = f.readlines()
        sample_rate_line = \
            filter(lambda x: x.startswith('real sample rate'), lines)[0]
        sample_rate = sample_rate_line.split('=')[-1].strip(' \n\r')
    return sample_rate


def putNewfilenames(data, sample_rate):
    if len(data) == 0:
        return
    data = map(lambda x: SCRIPT_BASE_PATH + "/" + x[-1], data)
    for d in data:
        payload = {
            "sample_rate": sample_rate,
            "file_name": d
        }
        p.produce(
            config['kafka']['consumer_h5']['topic'],
            json.dumps(payload), callback=delivery_report)
    p.poll(1)


while True:
    last_date = f_ops.getLastReadDate()
    ftp = f_ops.connectAndGetFTP()
    ftp.cwd(config['file_sync']['remote_folder'])
    config_fname = f_ops.fetchConfigFile(ftp)
    sample_rate = parseSampleRateFromConfig(config_fname)
    records = f_ops.getFileMetadata(ftp)
    records = f_ops.filterUnfetchedRecords(last_date, records)
    f_ops.updateLastReadDate(records)
    ftp.quit()
    ftp.close()
    putNewfilenames(records, sample_rate)
    time.sleep(1)
