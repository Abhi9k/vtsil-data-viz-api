import json
from models.cassandra_models import (
    SensorInfo, SensorDataByHour, PSDByHour)
from cassandra.cqlengine.query import BatchQuery
from cassandra import ConsistencyLevel
import utils.time_utils as time_utils
from utils.commons import splitRangeInHours, splitRangeInMinutes, splitRangeInSeconds
import constants as constants
from collections import defaultdict
from datavizapi.models.cassandra_models import session

timezone = constants.APP_TZ

SENSOR_DATE_TIME_FORMAT = '%Y-%m-%d %H:%M:%S:%f'
FILENAME_DATE_FORMAT = '%Y-%m-%d_%H_%M_%S'


def getSensorInfoAll():
    return SensorInfo.objects.all()


def sensorNameToIdMap():
    sensorObjects = getSensorInfoAll()
    daq_name_to_sid_map = {}

    for obj in sensorObjects:
        daq_name_to_sid_map[obj.daq_name] = obj.id
    return daq_name_to_sid_map


def formatSensorResponse(response):
    results = {}
    for res in response:
        if res.id not in results:
            results[res.id] = []
        results[res.id].append(
            {
                'ts': time_utils.formatTime(res.ts, timezone, constants.RES_DATE_FORMAT),
                'data': res.data,
            })
    return results


def insertSensorInfo(fname):
    data = None
    with open(fname, 'r') as f:
        data = json.loads(f.readline())
    gen_id = 0

    with BatchQuery() as b:
        for daq_name in data:
            value = data[daq_name]
            SensorInfo.batch(b).create(
                id=gen_id, floor_num=value['Floor Number'],
                orientation=value['Orientation'],
                bias_level=value['Bias Level'],
                sensitivity=value['Sensitivity'],
                serial_num=value['Serial'], daq_name=daq_name,
                x_pos=('' if value['X'] is None else str(value['X'])),
                y_pos=('' if value['Y'] is None else str(value['Y'])),
                z_pos=('' if value['Z'] is None else str(value['Z']))
            )
            gen_id += 1


def insertPSD(sid, total_power, power_dist, ts):
    date = time_utils.roundToMinute(ts)
    PSDByHour.consistency(ConsistencyLevel.LOCAL_ONE).create(
        id=sid, date=date, ts=ts,
        total_power=total_power, power_dist=power_dist)


def insertPSDBatch(ts, data):
    date = time_utils.roundToMinute(ts)
    with BatchQuery() as b:
        for sid, ts, total_power, power_dist in data:
            PSDByHour.consistency(ConsistencyLevel.LOCAL_ONE).batch(b).create(
                id=sid, date=date, ts=ts,
                total_power=total_power, power_dist=power_dist)


def insertSensorData(sid, ts, data):
    ts = time_utils.parseTime(ts, timezone, FILENAME_DATE_FORMAT)
    date = time_utils.roundToMinute(ts)
    SensorDataByHour.consistency(ConsistencyLevel.LOCAL_ONE).create(
        id=sid, ts=ts, date=date, data=data)


def getSensorsByFloor(floor_num):
    sensor_objects = getSensorInfoAll()
    response = []
    for obj in sensor_objects:
        if obj.floor_num == str(floor_num):
            temp = {
                'daq_name': obj.daq_name,
                'sid': obj.id
            }
            response.append(temp)
    return response


def fetchPSDByDate(
        date, from_ts, to_ts, defer_fields):
    query = PSDByHour.objects().limit(None).consistency(ConsistencyLevel.LOCAL_ONE)
    query = query.filter(date=date)
    query = query.filter(ts=from_ts)
    # query = query.filter(ts__gte=from_ts)
    # query = query.filter(ts__lte=to_ts)
    query = query.defer(defer_fields)

    return query.all()


def fetchPSD(
        from_ts, to_ts, get_power_dist=True,
        get_avg_power=True):
    dates = splitRangeInMinutes(from_ts, to_ts)
    defer_fields = ['date']
    if get_power_dist is False:
        defer_fields.append('power_dist')
    if get_avg_power is False:
        defer_fields.append('total_power')

    response = defaultdict(list)

    for date in dates:
        records = fetchPSDByDate(
            date, from_ts, to_ts, defer_fields)
        for record in records:
            response[record.id].append(record)
    return response


# def fetchPSD(
#         from_ts, to_ts, get_power_dist=True,
#         get_avg_power=True):
#     tss = splitRangeInSeconds(from_ts, to_ts)
#     defer_fields = ['date']
#     if get_power_dist is False:
#         defer_fields.append('power_dist')
#     if get_avg_power is False:
#         defer_fields.append('total_power')

#     response = defaultdict(list)
#     futures = []
#     query = "SELECT * FROM vtsil.psd_by_minute where date=%s and ts=%s"

#     for ts in tss:
#         date = time_utils.roundToMinute(ts)
#         date = time_utils.formatTime(date, 'utc', constants.RES_DATE_FORMAT)
#         ts = time_utils.formatTime(ts, 'utc', constants.RES_DATE_FORMAT)
#         futures.append(session.execute_async(query, [date, ts]))

#         # records = fetchPSDByDate(
#         #     date, ts, ts, defer_fields)
#     for future in futures:
#         records = future.result()
#         for record in records:
#             response[record['id']].append(record)
#     for k in response:
#         print(k, len(response[k]))
#     return response


def fetchLatestPSD(from_d, sids=None, get_power_dist=True, get_avg_power=True, to_d=None):
    if to_d is None:
        to_d = time_utils.editedTime(from_d, seconds=1)
    return fetchPSD(
        from_d, to_d, get_power_dist=get_power_dist,
        get_avg_power=get_avg_power)


def fetchSensorDataByDate(date, from_ts, to_ts, defer_fields):
    query = SensorDataByHour.objects().limit(None).consistency(ConsistencyLevel.LOCAL_ONE)
    query = query.filter(date=date)
    query = query.filter(ts__gte=from_ts)
    query = query.filter(ts__lte=to_ts)
    query = query.defer(defer_fields)

    return query.all()


def fetchSensorData(from_ts, to_ts):
    dates = splitRangeInHours(from_ts, to_ts)
    defer_fields = ['date']

    response = defaultdict(list)
    for date in dates:
        records = fetchSensorDataByDate(date, from_ts, to_ts, defer_fields)
        for record in records:
            response[record.id].append(record)
    return response
