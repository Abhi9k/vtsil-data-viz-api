import h5py
import math
import os
import json
import numpy as np
from confluent_kafka import Consumer, KafkaError
from confluent_kafka import Producer
from datetime import datetime, timedelta
SENSOR_DATE_TIME_FORMAT='%Y-%m-%d %H:%M:%S:%f'
FILENAME_DATE_FORMAT='%Y-%m-%d_%H_%M_%S'

p = Producer({
        'bootstrap.servers': 'node0,node1,node2',
        'default.topic.config': {'acks': '1'},
        'retries': 2,
        'max.in.flight.requests.per.connection': 1,
        'linger.ms': 100})
c = Consumer({     
        'bootstrap.servers': 'node0,node1,node2',
        'group.id': 'mygroup',
        'auto.offset.reset': 'earliest'})
c.subscribe(['incomingFiles'])

sensor_name_to_id = {
    "1W-3_13": "4", "1W-3_12": "5", "1W-3_11": "6", "1W-3_10": "7", "1W-3_16": "8", "1W-3_15": "9",
    "1W-3_14": "10", "1W-4_05": "11", "1W-4_04": "12", "1W-4_07": "13", "1W-4_06": "14", "1W-4_01": "15",
    "1W-4_03": "16", "1W-4_02": "17", "3E-2_10": "18", "3E-2_11": "19", "3E-2_12": "20", "3E-2_13": "21",
    "3E-2_14": "22", "3E-2_15": "23", "3E-2_16": "24", "4E-3_03": "25", "4E-3_02": "26", "4E-3_01": "27",
    "4E-3_07": "28", "4E-3_06": "29", "4E-3_05": "30", "1W-4_08": "31", "1E-2_04": "169", "1E-3_15": "33",
    "1E-3_14": "34", "1E-3_16": "35", "1E-3_11": "36", "1E-3_10": "37", "1E-3_13": "38", "1E-4_03": "39",
    "1E-4_02": "40", "1E-4_01": "41", "1E-4_07": "42", "1E-4_06": "43", "1E-4_05": "44", "1E-4_04": "45",
    "1E-4_09": "46", "1E-4_08": "47", "1W-3_01": "48", "1W-3_02": "49", "1W-3_03": "50", "1W-3_04": "51",
    "1W-3_05": "52", "1W-3_06": "53", "1W-3_07": "54", "1W-3_08": "55", "1W-3_09": "56", "1E-5_02": "57",
    "1E-5_03": "58", "3E-5_11": "183", "3E-5_13": "59", "3E-5_12": "71", "1E-2_02": "174", "1E-3_09": "60", "1E-3_02": "61", "1E-3_03": "62", "1E-3_01": "63", "4E-3_09": "32", "1E-4_10": "64", "1E-4_11": "65", "1E-4_12": "66", "4E-3_08": "79", "1E-4_14": "68", "1E-4_15": "69", "1E-4_16": "70", "3E-5_08": "72", "3E-5_09": "73", "3E-5_03": "74", "3E-5_06": "75", "3E-5_07": "76", "3E-5_04": "77", "3E-5_05": "78", "3E-3_13": "82", "3E-3_12": "83", "3E-3_11": "84", "3E-3_10": "85", "3E-3_16": "86", "3E-3_15": "87", "3E-3_14": "88", "1E-4_13": "67", "4E-3_04": "90", "4W-2_15": "91", "4W-2_14": "92", "4W-2_16": "93", "4W-2_11": "94", "4W-2_10": "95", "4W-2_13": "96", "4W-2_12": "97", "3E-4_05": "99", "3E-4_04": "100", "3E-4_06": "101", "3E-4_01": "102", "3E-4_03": "103", "3E-4_02": "104", "3E-4_09": "105", "3E-4_08": "106", "3E-3_08": "107", "3E-3_01": "108", "3E-3_02": "109", "3E-3_06": "110", "3E-3_07": "111", "4E-2_13": "112", "4E-2_12": "113", "4E-2_11": "114", "4E-2_10": "115", "4E-2_16": "116", "4E-2_15": "117", "4E-2_14": "118", "4W-2_02": "120", "4W-2_03": "121", "4W-2_01": "122", "4W-2_06": "123", "4W-2_07": "124", "4W-2_04": "125", "4W-2_05": "126", "3E-6_07": "127", "3E-6_06": "128", "4W-2_08": "129", "4W-2_09": "130", "3E-6_03": "131", "3E-6_02": "132", "3E-6_01": "133", "3E-4_10": "134", "3E-4_11": "135", "3E-4_16": "136", "3E-4_14": "137", "3E-4_15": "138", "3E-6_08": "140", "4W-5_03": "141", "4W-5_02": "142", "4W-5_01": "143", "4W-5_07": "144", "4W-5_06": "145", "4W-5_05": "146", "4W-5_04": "147", "4E-2_01": "148", "4E-2_02": "149", "4E-2_03": "150", "4E-2_04": "151", "4E-2_05": "152", "4E-2_06": "153", "4E-2_07": "154", "4E-2_08": "155", "4E-2_09": "156", "4W-4_16": "139", "4W-4_15": "157", "4W-3_04": "158", "4W-3_01": "159", "4W-3_03": "160", "4W-3_02": "161", "1W-2_09": "162", "1W-2_08": "163", "1W-2_07": "164", "1W-2_06": "165", "1W-2_05": "166", "1W-2_04": "167", "1E-2_05": "168", "3E-5_15": "119", "1E-2_07": "170", "1E-2_06": "171", "1E-2_01": "172", "1E-2_03": "173", "3E-5_14": "98", "1E-2_16": "200", "1E-2_09": "175", "1E-2_08": "176", "4W-4_01": "177", "4W-4_02": "178", "4W-4_03": "80", "4W-4_04": "180", "4W-4_05": "181", "4W-4_06": "81", "4W-4_07": "182", "4W-4_08": "89", "3E-2_03": "184", "3E-2_02": "185", "3E-2_01": "186", "3E-2_07": "187", "3E-2_09": "188", "3E-2_08": "189", "1W-2_10": "190", "1W-2_11": "191", "1W-2_12": "192", "1W-2_13": "193", "1W-2_14": "194", "1W-2_15": "195", "1W-2_16": "196", "1E-2_12": "197", "1E-2_10": "198", "1E-2_11": "199", "3E-5_16": "179"}

def delivery_report(err, msg):
    """ Called once for each message produced to indicate delivery result.
        Triggered by poll() or flush(). """
    if err is not None:
        print('Message delivery failed: {}'.format(err))
    else:
        print('Message delivered to {} [{}]'.format(msg.topic(), msg.partition()))

def parseStartDateTime(h5name):
    return parseDate(h5name.split('/')[-1].split('.')[0])

def readH5(fname, sample_rate):
    f = h5py.File(fname, 'r')
    data = f['/Data']
    keys = data.keys()
    flattened_data = map(lambda k: (k,data.get(k).value.flatten()), keys)
    f.close()
    return flattened_data

def putRawDataInQueue(ts, data):
    for k, v in data:
        payload = {
            "ts": ts,
            "daq_name": k[5:],
            "d": v.tolist()
        }
        print(payload['daq_name']+","+payload['ts'])
        p.produce("raw"+k, value=json.dumps(payload), callback=delivery_report)
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
    data = readH5(fname, sample_rate)
    putRawDataInQueue(ts.split('/')[-1], data)