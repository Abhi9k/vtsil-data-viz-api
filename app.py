from flask import (
    Flask, jsonify, request, url_for,
    render_template,make_response)
import datavizapi.cassandra_operations as db_op
from datavizapi.utils.time_utils import (
    currTime, editedTime, formatTime, parseTime)
import datavizapi.constants as constants

app = Flask(__name__,static_url_path='',static_folder='web/',template_folder='templates')


def getCookieValue(st):
    start_time = '2019-02-19 10:45:32'
    # start_time = '2019-02-16 20:45:32'

    curr_time = currTime()
    if st is None:
        st = start_time
    else:
        st_parsed = parseTime(st, 'US/Eastern', constants.RES_DATE_FORMAT)
        st_parsed = editedTime(st_parsed, seconds=1)
        st = formatTime(st_parsed, 'US/Eastern', constants.RES_DATE_FORMAT)

    return st

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/explore')
def explore():
    return render_template('explore.html')

@app.route('/api/stream', methods=('get',))
def streaming():
    num_of_seconds = int(request.args.get('ns'))

    from_d_str = getCookieValue(request.cookies.get('st'))
    from_d = parseTime(from_d_str, 'US/Eastern', constants.RES_DATE_FORMAT)

    results = db_op.fetchLatestPSD(from_d)

    response = {'v1': [], 'v2': []}

    map_id_res = [(res.id, res) for res in results]
    map_id_res = dict(map_id_res)
    sid_list = map_id_res.keys()

    # for v1

    value = {}
    for res in results:
        value[str(res.id)] = res.total_power
    response['v1'].append(
        {'ts': formatTime(res.ts, 'US/Eastern', constants.RES_DATE_FORMAT, is_utc=False),
         'value': value})

    # for v2
    for sid in sid_list:
        v = map_id_res[sid]
        temp = {"id": str(sid), "data": []}
        l = len(v.power_dist)
        si = 0
        while si<l:
            temp['data'].append({"f": float(si), "p": v.power_dist[si]})
            si+=1
        response['v2'].append(temp)

    resp=make_response(jsonify(response))
    resp.set_cookie('st', from_d_str)


    return resp

@app.route('/api/sensor_info', methods=('get',))
def getSensorInfo():
    sensor_objs = db_op.sensorObjects
    resp_dict = {}
    for obj in sensor_objs:
        resp_dict[str(obj.id)] = {
            'daq_name': obj.daq_name,
            'floor': obj.floor_num,
            'orientation': obj.orientation,
            'sensitivity': obj.sensitivity,
            'serial': obj.serial_num
        }
    return jsonify(resp_dict)

@app.route('/api/explore/<sensor_name>')
def getExplorationForSensor(sensor_name):
    from_time_str = request.args.get('from')
    to_time_str = request.args.get('to')

    sid = db_op.daq_name_to_sid_map[sensor_name]
    from_time = parseTime(from_time_str, 'US/Eastern', constants.RES_DATE_FORMAT)
    to_time = parseTime(to_time_str, 'US/Eastern', constants.RES_DATE_FORMAT)

    if((sid is None) or (from_time>to_time)):
        return jsonify({'msg':'error'})

    raw = db_op.fetchSensorData(from_time, to_time, sids=[sid], descending=False)
    psd = db_op.fetchPSD(from_time, to_time, sids=[sid], get_power_dist=False, descending=False)

    response = {'raw': [], 'psd': []}

    for data in raw:
        sample_freq = len(data.data)
        micros = 1000000/sample_freq
        ts = editedTime(data.ts, is_utc=False)
        response['raw'].append([ts, sum(data.data)/sample_freq])
        # for i in range(sample_freq):
        #     ts = editedTime(data.ts, microseconds=i*micros, is_utc=False)
        #     ts = formatTime(ts, 'US/Eastern', constants.DATE_FORMAT)
        #     response['raw'].append([ts, data.data[i]])
    for data in psd:
        ts = formatTime(data.ts, 'US/Eastern', constants.RES_DATE_FORMAT, is_utc=False)
        response['psd'].append([ts, data.total_power])

    return jsonify(response)



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
