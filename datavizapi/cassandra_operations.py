import json
from models.cassandra_models import (
    SensorInfo, SensorDataByHour, PSDByHour)
from cassandra.cqlengine.query import BatchQuery
from cassandra import ConsistencyLevel
import utils.time_utils as time_utils
from utils.commons import splitRangeInHours
import constants as constants
# from collections import namedtuple

timezone = constants.APP_TZ

SENSOR_DATE_TIME_FORMAT = '%Y-%m-%d %H:%M:%S:%f'
FILENAME_DATE_FORMAT = '%Y-%m-%d_%H_%M_%S'

# PSDResponse = namedtuple('PSD', ['ts', 'total_power', 'power_dist'])


def getSensorInfoAll():
    return SensorInfo.objects.all()


def sensorNameToIdMap():
    sensorObjects = getSensorInfoAll()
    daq_name_to_sid_map = {}

    for obj in sensorObjects:
        daq_name_to_sid_map[obj.daq_name] = obj.id
    return daq_name_to_sid_map


def formatPSDResponse(response):
    results = {}
    for res in response:
        if res.id not in results:
            results[res.id] = []
        results[res.id].append(
            {
                'ts': time_utils.formatTime(res.ts, timezone, constants.RES_DATE_FORMAT),
                'total_power': res.total_power,
                'power_dist': res.power_dist
            })
    return results


def emptyPSDResponse(sids, ts, sample_f=256):
    results = {}
    for sid in sids:
        results[sid] = []
        results[sid].append(
            {
                'ts': time_utils.formatTime(ts, timezone, constants.RES_DATE_FORMAT),
                'total_power': 0.0,
                'power_dist': [0] * sample_f
            })
    return results


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
    ts = time_utils.parseTime(ts, timezone, FILENAME_DATE_FORMAT)
    date = time_utils.roundToHour(ts)
    PSDByHour.consistency(ConsistencyLevel.LOCAL_ONE).create(
        id=sid, date=date, ts=ts,
        total_power=total_power, power_dist=power_dist)


def insertSensorData(sid, ts, data):
    ts = time_utils.parseTime(ts, timezone, FILENAME_DATE_FORMAT)
    date = time_utils.roundToHour(ts)
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


def fetchPSDForSensor(
        date, sid, from_ts, to_ts, defer_fields, descending=True):
    query = PSDByHour.objects.consistency(ConsistencyLevel.LOCAL_ONE)
    query = query.filter(id=sid)
    query = query.filter(date=date)
    query = query.filter(ts__gte=from_ts)
    query = query.filter(ts__lte=to_ts)
    query = query.order_by('-ts')
    if not descending:
        query = query.order_by('ts')
    query = query.defer(defer_fields)
    response = query.all()

    return list(response)


def fetchPSDImproved(
        from_ts, to_ts, sids=None, get_power_dist=True,
        get_avg_power=True, descending=True):
    if sids is None:
        sids = sensorNameToIdMap().values()
    dates = splitRangeInHours(from_ts, to_ts)
    defer_fields = ['date']
    if get_power_dist is False:
        defer_fields.append('power_dist')
    if get_avg_power is False:
        defer_fields.append('total_power')

    response = {}
    for sid in sids:
        response[sid] = []
        for date in dates:
            response[sid] += fetchPSDForSensor(
                date, sid, from_ts, to_ts, defer_fields, descending=descending)
    return response


def fetchPSD(from_ts, to_ts, sids=None, get_power_dist=True, get_avg_power=True, descending=True):
    if sids is None:
        sids = sensorNameToIdMap().values()

    dates = splitRangeInHours(from_ts, to_ts)
    defer_fields = ['date']
    if get_power_dist is False:
        defer_fields.append('power_dist')
    if get_avg_power is False:
        defer_fields.append('total_power')

    query = PSDByHour.objects.consistency(ConsistencyLevel.LOCAL_ONE)
    query = query.filter(id__in=sids)
    query = query.filter(date__in=dates)
    query = query.filter(ts__gte=from_ts)
    query = query.filter(ts__lte=to_ts)
    query = query.order_by('-ts')
    if not descending:
        query = query.order_by('ts')
    query = query.defer(defer_fields)

    response = query.all()

    if len(response) == 0:
        response = emptyPSDResponse(sids, from_ts)
    else:
        response = formatPSDResponse(response)
    return response


def fetchLatestPSD(from_d, sids=None, get_power_dist=True, get_avg_power=True, to_d=None):
    if to_d is None:
        to_d = time_utils.editedTime(from_d, seconds=1)
    return fetchPSDImproved(
        from_d, to_d, sids=sids, get_power_dist=get_power_dist,
        get_avg_power=get_avg_power, descending=True)


def fetchSensorDataById(sid, date, from_ts, to_ts, defer_fields, descending=True):
    query = SensorDataByHour.objects.consistency(ConsistencyLevel.LOCAL_ONE)
    query = query.filter(id=sid)
    query = query.filter(date=date)
    query = query.filter(ts__gte=from_ts)
    query = query.filter(ts__lte=to_ts)
    query = query.defer(defer_fields)
    query = query.order_by('-ts')
    if not descending:
        query = query.order_by('ts')

    return list(query.all())


def fetchSensorData(from_ts, to_ts, sids=None, descending=True):
    if sids is None:
        sids = sensorNameToIdMap().values()
    dates = splitRangeInHours(from_ts, to_ts)
    defer_fields = ['date']

    response = {}
    for sid in sids:
        response[sid] = []
        for date in dates:
            response[sid] += fetchSensorDataById(
                sid, date, from_ts, to_ts, defer_fields, descending)
    return response
