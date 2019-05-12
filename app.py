from flask import (
    Flask, jsonify, request, after_this_request,
    render_template, make_response)
import datavizapi.cassandra_operations as db_op
from datavizapi.utils.time_utils import (
    editedTime, formatTime, parseTime, currTime)
import datavizapi.constants as constants
from datavizapi import AppConfig
from cStringIO import StringIO as IO
import gzip
import functools
import json
from datavizapi.utils import commons
from collections import defaultdict

app = Flask(__name__, static_url_path='', static_folder='web/', template_folder='templates')
config = AppConfig().getConfig()
STREAMING_INCR = 1
timezone = constants.APP_TZ


@app.route('/api/export')
def dataExport():
    from_ts = request.args.get('f')
    to_ts = request.args.get('t')
    daq_names = request.args.getlist('daqname')
    fname = request.args.get('fname')
    sensor_objs = db_op.getSensorInfoAll()
    sids = []
    for obj in sensor_objs:
        if obj.daq_name in daq_names:
            sids.append(obj.id)
    commons.produceToKafka(
        config['kafka']['file_download']['topic'],
        json.dumps({'fname': fname, 'sids': sids,
                    'from_ts': from_ts, 'to_ts': to_ts}))
    return make_response(jsonify({}))


def gzipped(f):
    """
    taken from: http://flask.pocoo.org/snippets/122/
    """
    @functools.wraps(f)
    def view_func(*args, **kwargs):
        @after_this_request
        def zipper(response):
            accept_encoding = request.headers.get('Accept-Encoding', '')

            if 'gzip' not in accept_encoding.lower():
                return response

            response.direct_passthrough = False

            if (response.status_code < 200 or
                    response.status_code >= 300 or
                    'Content-Encoding' in response.headers):
                return response
            gzip_buffer = IO()
            gzip_file = gzip.GzipFile(mode='wb',
                                      fileobj=gzip_buffer)
            gzip_file.write(response.data)
            gzip_file.close()

            response.data = gzip_buffer.getvalue()
            response.headers['Content-Encoding'] = 'gzip'
            response.headers['Vary'] = 'Accept-Encoding'
            response.headers['Content-Length'] = len(response.data)

            return response

        return f(*args, **kwargs)

    return view_func


def getCookieValue(st, start_ts, incr=STREAMING_INCR):
    if (st is None) or (parseTime(st, timezone, constants.RES_DATE_FORMAT) < start_ts):
        st = formatTime(start_ts, timezone, constants.RES_DATE_FORMAT)
    else:
        st_parsed = parseTime(st, timezone, constants.RES_DATE_FORMAT)
        st_parsed = editedTime(st_parsed, seconds=incr)
        st = formatTime(st_parsed, timezone, constants.RES_DATE_FORMAT)

    return st


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/building')
def building():
    return render_template('building.html')


@app.route('/explore')
def explore():
    return render_template('explore.html')


@app.route('/floorwise')
def floorwise():
    return render_template('floorwise.html')


@app.route('/api/stream', methods=('get',))
@gzipped
def streaming():
    start_ts = request.args.get('t')
    incr = int(request.args.get('ns'))
    if start_ts:
        start_ts = parseTime(start_ts, timezone,
                             constants.RES_DATE_FORMAT)
    else:
        start_ts = currTime()
    from_d_str = getCookieValue(request.cookies.get('st'), start_ts, incr=incr)

    from_d = parseTime(from_d_str, timezone, constants.RES_DATE_FORMAT)
    to_d = editedTime(from_d, seconds=STREAMING_INCR)

    results = db_op.fetchLatestPSD(from_d, to_d=to_d)
    sid_list = results.keys()

    response = {'v1': [], 'v2': []}

    # for v1

    value = {}
    for sid, val in results.items():
        if len(val) > 0:
            value[str(sid)] = val[0]['total_power']
    response['v1'].append(
        {'ts': results[sid_list[0]][0]['ts'],
         'value': value})

    # for v2
    for sid, v in results.items():
        if len(v) > 0:
            temp = {"id": str(sid), "data": []}
            num_freq = len(v[0]['power_dist']) / 2
            si = 0
            while si < num_freq:
                temp['data'].append({"f": float(si), "p": v[0]['power_dist'][si]})
                si += 1
            response['v2'].append(temp)

    resp = make_response(jsonify(response))
    resp.set_cookie('st', from_d_str)

    return resp


@app.route('/api/psd/<sensor_id>', methods=('get',))
def getSensorPSD(sensor_id):
    ts = request.args.get('d')
    if ts is None:
        return make_response(
            jsonify({'msg': 'error', 'reason': 'invalid/empty timestamp'}))

    from_ts = parseTime(ts, timezone,
                        constants.RES_DATE_FORMAT)
    results = db_op.fetchPSDAsync(
        from_ts, from_ts, get_avg_power=False, get_power_dist=True)
    response = {'data': []}

    for idx, data in enumerate(results[int(sensor_id)][0]['power_dist']):
        response['data'].append([idx, data])
    return make_response(jsonify(response))


@app.route('/api/floor/psd/<floor_num>', methods=('get',))
@gzipped
def floorPSD(floor_num):
    ts_from = request.args.get('from')
    ts_to = request.args.get('to')
    if (ts_from is None) or (ts_to is None):
        return make_response(
            jsonify({'msg': 'error', 'reason': 'invalid/empty timestamp'}))
    ts_from = parseTime(ts_from, timezone,
                        constants.RES_DATE_FORMAT)
    ts_to = parseTime(ts_to, timezone,
                      constants.RES_DATE_FORMAT)
    sensors = db_op.getSensorsByFloor(floor_num)
    sids = map(lambda x: x['sid'], sensors)
    results = db_op.fetchPSDAsync(
        ts_from, ts_to, get_power_dist=False)
    sids = [sid for sid in results.keys() if sid in sids]
    response = defaultdict(list)
    for sid in sids:
        results[sid] = sorted(results[sid], key=lambda x: x['ts'])
        for v in results[sid]:
            response[sid].append(
                [formatTime(v['ts'], timezone, constants.RES_DATE_FORMAT),
                 v['total_power']])

    return make_response(jsonify(response))


@app.route('/api/sensor_info', methods=('get',))
def getSensorInfo():
    sensor_objs = db_op.getSensorInfoAll()
    resp_dict = {}
    for obj in sensor_objs:
        resp_dict[str(obj.id)] = {
            'daq_name': obj.daq_name,
            'floor': obj.floor_num,
            'orientation': obj.orientation,
            'sensitivity': obj.sensitivity,
            'serial': obj.serial_num,
            'name': obj.name
        }
    return jsonify(resp_dict)


@app.route('/api/explore/<sensor_name>', methods=('get',))
def getExplorationForSensor(sensor_name):
    from_time_str = request.args.get('from')
    to_time_str = request.args.get('to')

    sid = db_op.sensorNameToIdMap()[sensor_name]
    from_time = parseTime(from_time_str, timezone, constants.RES_DATE_FORMAT)
    to_time = parseTime(to_time_str, timezone, constants.RES_DATE_FORMAT)

    if((sid is None) or (from_time > to_time)):
        return jsonify({'msg': 'error'})

    psd = db_op.fetchPSDAsyncById(
        from_time, to_time, sid, get_power_dist=False)

    response = {'raw': [], 'psd': []}

    if sid not in psd:
        return make_response(jsonify(response))

    psd[sid] = sorted(psd[sid], key=lambda x: x['ts'])

    for data in psd[sid]:
        response['psd'].append([data['ts'], data['total_power']])

    return make_response(jsonify(response))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
