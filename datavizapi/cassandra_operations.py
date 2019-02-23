import json
from models.cassandra_models import (
    SensorInfo, SensorDataByHour, PSDByHour)
from cassandra.cqlengine.query import BatchQuery
from cassandra import ConsistencyLevel
import utils.time_utils as time_utils
from utils.commons import splitRangeInHours

SENSOR_DATE_TIME_FORMAT = '%Y-%m-%d %H:%M:%S:%f'
FILENAME_DATE_FORMAT = '%Y-%m-%d_%H_%M_%S'


def getSensorInfoAll():
    return SensorInfo.objects.all()


sensorObjects = getSensorInfoAll()
daq_name_to_sid_map = {}

for obj in sensorObjects:
    daq_name_to_sid_map[obj.daq_name] = obj.id


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
    ts = time_utils.parseTime(ts, 'US/Eastern', FILENAME_DATE_FORMAT)
    date = time_utils.roundToHour(ts)
    PSDByHour.consistency(ConsistencyLevel.LOCAL_ONE).create(
        id=sid, date=date, ts=ts,
        total_power=total_power, power_dist=power_dist)


def insertSensorData(sid, ts, data):
    ts = time_utils.parseTime(ts, 'US/Eastern', FILENAME_DATE_FORMAT)
    date = time_utils.roundToHour(ts)
    SensorDataByHour.consistency(ConsistencyLevel.LOCAL_ONE).create(
        id=sid, ts=ts, date=date, data=data)


def fetchPSD(from_ts, to_ts, sids=None, get_power_dist=True, get_avg_power=True, descending=True):
    if sids is None:
        sids = daq_name_to_sid_map.values()
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

    return query.all()


def fetchLatestPSD(from_d, sids=None, get_power_dist=True, get_avg_power=True):
    if sids is None:
        sids = daq_name_to_sid_map.values()

    dates = splitRangeInHours(from_d, from_d)

    defer_fields = ['date']
    if get_power_dist is False:
        defer_fields.append('power_dist')
    if get_avg_power is False:
        defer_fields.append('total_power')
    query = PSDByHour.objects.consistency(ConsistencyLevel.LOCAL_ONE)
    query = query.filter(id__in=sids)
    query = query.filter(date__in=dates)
    query = query.filter(ts__gte=from_d)
    query = query.filter(ts__lte=from_d)
    query = query.order_by('-ts')
    query = query.defer(defer_fields)

    from_d = time_utils.editedTime(from_d, seconds=1)
    res = query.all()

    return res


def fetchSensorData(from_ts, to_ts, sids=None, descending=True):
    if sids is None:
        sids = daq_name_to_sid_map.values()
    dates = splitRangeInHours(from_ts, to_ts)
    defer_fields = ['date']

    query = SensorDataByHour.objects.consistency(ConsistencyLevel.LOCAL_ONE)
    query = query.filter(id__in=sids)
    query = query.filter(date__in=dates)
    query = query.filter(ts__gte=from_ts)
    query = query.filter(ts__lte=to_ts)
    query = query.defer(defer_fields)
    query = query.order_by('-ts')
    if not descending:
        query = query.order_by('ts')

    return query.all()
