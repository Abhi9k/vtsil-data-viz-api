from confluent_kafka import Consumer
from datavizapi import AppConfig
import json
from datavizapi.utils import time_utils, commons
import datavizapi.constants as constants
import datavizapi.cassandra_operations as db_op
from collections import defaultdict
from datetime import datetime

config = AppConfig().getConfig()

c = Consumer({
    'bootstrap.servers': ",".join(config['kafka']['servers']),
    'group.id': config['kafka']['file_download']['group'],
    'auto.offset.reset': config['kafka']['file_download']['offset']})

c.subscribe([config['kafka']['file_download']['topic']])


def getRawSensorData(from_ts, to_ts):
    dates = commons.splitRangeInHours(from_ts, to_ts)
    for date in dates:
        yield db_op.fetchSensorDataByDate(date, from_ts, to_ts, ['date'])


def formatRawSensorData(sensor_data, sids, fs):
    sid_index = {k: i for i, k in enumerate(sids)}
    for ts, data in sensor_data.items():
        response = [[0] * len(sids) for _ in range(fs)]
        for item in data:
            idx = sid_index[item['id']]
            for i, val in enumerate(item['data']):
                response[i][idx] = val
        for row in response:
            row = map(str, row)
            yield ",".join(row) + "\n"


def generate(from_ts, to_ts, sids, fs):
    data_gen = getRawSensorData(from_ts, to_ts)()
    for data in data_gen:
        raw = data.all()
        raw_data_map = defaultdict(list)
        for item in raw:
            if item.id in sids:
                raw_data_map[item.ts].append(item)
        yield next(formatRawSensorData(raw_data_map, sids, fs))


while True:
    msg = c.poll(1)
    if msg is None:
        continue
    if msg.error():
        print("Consumer error: {}".format(msg.error()))
        continue
    msg = json.loads(msg.value())
    try:
        from_ts = time_utils.parseTime(msg['from_ts'], constants.APP_TZ, constants.RES_DATE_FORMAT)
        to_ts = time_utils.parseTime(msg['to_ts'], constants.APP_TZ, constants.RES_DATE_FORMAT)
        fname = msg['fname']
        sids = msg['sids']
        sids = map(int, sids)
        print(from_ts, to_ts, fname, sids)
        # sample_frequency = msg['fs']
        sample_frequency = 1024
        f = open('/home/vast/ftp/files/' + fname + '.csv', 'w')
        future_results = db_op.fetchSensorDataById(from_ts, to_ts, sids[0])
        s = datetime.now()
        for future in future_results:
            result = future.result()
            raw_data_map = defaultdict(list)
            for row in result:
                if row['id'] in sids:
                    raw_data_map[row['ts']].append(row)
            row = formatRawSensorData(raw_data_map, sids, sample_frequency)
            while True:
                try:
                    r = next(row)
                    f.write(r)
                except StopIteration:
                    break
        print((datetime.now() - s).total_seconds())
        f.close()
    except Exception, e:
        print(str(e))
        pass
