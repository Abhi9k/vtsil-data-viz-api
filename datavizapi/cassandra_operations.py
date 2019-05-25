import json
from models.cassandra_models import (
    SensorInfo, SensorDataByHour)
from cassandra.cqlengine.query import BatchQuery
from cassandra import ConsistencyLevel
import utils.time_utils as time_utils
from utils.commons import splitRangeInMinutes, splitRangeInSeconds
import constants as constants
from collections import defaultdict
from datavizapi.models.cassandra_models import session
from cassandra.query import SimpleStatement

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


def insertPSDAsync(sid, total_power, power_dist, ts):
    date = time_utils.roundToMinute(ts)
    query = SimpleStatement(
        """INSERT INTO vtsil.psd_by_minute (id,date,ts,total_power,power_dist)
        VALUES(%s,%s,%s,%s,%s)""")
    return session.execute_async(query, (sid, date, ts, total_power, power_dist))


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


def fetchSensorDataAsync(from_ts, to_ts):
    response = defaultdict(list)
    future_results = fetchSensorData(from_ts, to_ts)
    for future in future_results:
        result = future.result()
        for row in result:
            response[row['id']].append(row)
    return response


def fetchPSDAsync(from_ts, to_ts, get_power_dist=False, get_avg_power=True):
    selection = "id,ts"
    if get_avg_power:
        selection += ",total_power"
    if get_power_dist:
        selection += ",power_dist"

    query = SimpleStatement(
        "SELECT {0} FROM vtsil.psd_by_minute where date=%s and ts=%s".format(selection),
        fetch_size=None)
    # query = "SELECT {0} FROM vtsil.psd_by_minute where date=%s and ts=%s".format(selection)
    response = defaultdict(list)
    future_results = []
    ts_list = splitRangeInSeconds(from_ts, to_ts)

    for ts in ts_list:
        date = time_utils.roundToMinute(ts)
        date = time_utils.formatTime(date, 'utc', constants.RES_DATE_FORMAT)
        ts = time_utils.formatTime(ts, 'utc', constants.RES_DATE_FORMAT)
        future_results.append(session.execute_async(query, [date, ts]))
    for future in future_results:
        result = future.result()
        for row in result:
            response[row['id']].append(row)
    return response


def fetchPSDAsyncById(from_ts, to_ts, sid, get_power_dist=False, get_avg_power=True):
    selection = "id,ts"
    if get_avg_power:
        selection += ",total_power"
    if get_power_dist:
        selection += ",power_dist"

    query = SimpleStatement(
        "SELECT {0} FROM vtsil.psd_by_minute where date=%s and ts=%s and id=%s".format(selection),
        fetch_size=None)
    # query = "SELECT {0} FROM vtsil.psd_by_minute where date=%s and ts=%s".format(selection)
    response = defaultdict(list)
    future_results = []
    ts_list = splitRangeInSeconds(from_ts, to_ts)

    for ts in ts_list:
        date = time_utils.roundToMinute(ts)
        date = time_utils.formatTime(date, 'utc', constants.RES_DATE_FORMAT)
        ts = time_utils.formatTime(ts, 'utc', constants.RES_DATE_FORMAT)
        future_results.append(session.execute_async(query, [date, ts, sid]))
    for future in future_results:
        result = future.result()
        for row in result:
            response[row['id']].append(row)
    return response


def fetchLatestPSD(from_d, sids=None, get_power_dist=True, get_avg_power=True, to_d=None):
    if to_d is None:
        to_d = time_utils.editedTime(from_d, seconds=1)
    return fetchPSDAsync(
        from_d, to_d, get_power_dist=get_power_dist,
        get_avg_power=get_avg_power)


def fetchSensorData(from_ts, to_ts):
    query = SimpleStatement(
        "SELECT id,ts,data FROM vtsil.sensor_data_by_minute where date=%s and ts=%s",
        fetch_size=None)
    future_results = []
    ts_list = splitRangeInSeconds(from_ts, to_ts)

    for ts in ts_list:
        date = time_utils.roundToMinute(ts)
        date = time_utils.formatTime(date, 'utc', constants.RES_DATE_FORMAT)
        ts = time_utils.formatTime(ts, 'utc', constants.RES_DATE_FORMAT)
        future_results.append(session.execute_async(query, [date, ts]))
    return future_results


def fetchSensorDataById(from_ts, to_ts, sid):
    query = SimpleStatement(
        "SELECT id,ts,data FROM vtsil.sensor_data_by_minute where date=%s and ts=%s and id=%s",
        fetch_size=None)
    future_results = []
    ts_list = splitRangeInSeconds(from_ts, to_ts)

    for ts in ts_list:
        date = time_utils.roundToMinute(ts)
        date = time_utils.formatTime(date, 'utc', constants.RES_DATE_FORMAT)
        ts = time_utils.formatTime(ts, 'utc', constants.RES_DATE_FORMAT)
        future_results.append(session.execute_async(query, [date, ts, sid]))
    return future_results


def fetchSensorDataPerMinute(from_ts, to_ts):
    query = SimpleStatement(
        "SELECT id,ts,data FROM vtsil.sensor_data_by_minute where date=%s and ts>=%s and ts<=%s",
        fetch_size=None)
    future_results = []
    date_list = splitRangeInMinutes(from_ts, to_ts)
    from_ts = time_utils.formatTime(from_ts, 'utc', constants.RES_DATE_FORMAT)
    to_ts = time_utils.formatTime(to_ts, 'utc', constants.RES_DATE_FORMAT)
    for date in date_list:
        date = time_utils.formatTime(date, 'utc', constants.RES_DATE_FORMAT)

        future_results.append(
            session.execute_async(query, [date, from_ts, to_ts]))
    return future_results
