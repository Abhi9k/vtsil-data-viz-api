from flask import Flask, jsonify, request, url_for,render_template,make_response
from flask_socketio import SocketIO, emit

from datavizapi.psd import (small_sample_dataset, total_data_in_time_range,
                 average_power_in_time_range,
                 average_power_in_time_range_in_freq_range)
from datavizapi.sensor_metadata import get_sensor_metadata
from datavizapi.utils import addNSeconds,parseDate,SENSOR_DATE_TIME_FORMAT,formatDate
from datetime import datetime,timedelta

app = Flask(__name__,static_url_path='',static_folder='web/',template_folder='templates')
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/sample/<count>')
def get_small_dataset(count=1):
    count = int(request.args.get("count", count))
    count = min(count, 2000)
    return jsonify(small_sample_dataset(count))


@app.route('/api/avg_power/<start>/<end>/<f1>/<f2>/<sid>')
def get_energy_history_in_time_range_in_freq_range(start, end, f1, f2, sid):
    data=average_power_in_time_range_in_freq_range(start, end, f1, f2)
    data=data[int(sid)];
    resp=[]
    for i in range(len(data['timestamp'])):
        resp.append({"x":data['timestamp'][i],"y":data['average_power'][i]})
    return jsonify(resp)


@app.route('/api/all/<start>/<end>')
def psd_data_in_time_range(start, end):
    return jsonify(total_data_in_time_range(start, end))


@app.route('/api/avg_power/<start>/<end>')
def psd_data_avg_power_in_time_range(start, end):
    return jsonify(average_power_in_time_range(start, end))


@app.route('/api/sensor_info/<daq_id>')
def get_sensor_info(daq_id):
    return jsonify(get_sensor_metadata(daq_id))


def getStartEndTime(cookies):
    start_time='2017-12-02 13:00:00'
    st=cookies.get('st')
    valid_till=request.cookies.get('valid_till')
    curr_time=datetime.now()
    if st is None:
        st=start_time
    ndt=addNSeconds(st,4)
    if valid_till:
        expiry_time=parseDate(valid_till,SENSOR_DATE_TIME_FORMAT)
        if expiry_time < curr_time:
            st=start_time
            ndt=addNSeconds(st,0)
    return curr_time,st,ndt

@app.route('/api/stream')
def streaming():
    curr_time,st,ndt=getStartEndTime(request.cookies)
    exp_time=formatDate(curr_time+timedelta(minutes=5))
    raw_resp=psd_data_in_time_range(st,ndt)
    resp=make_response(raw_resp)
    resp.set_cookie('st',ndt)
    resp.set_cookie('valid_till',exp_time)
    return resp

@app.route('/api/bargraph')
def bargraph():
    curr_time,st,ndt=getStartEndTime(request.cookies)
    exp_time=formatDate(curr_time+timedelta(minutes=5))
    data=total_data_in_time_range(st,ndt)

    freqs,data=data['freqs'],data['data']
    sensor_ids=data.keys()
    N=len(data[sensor_ids[0]]['power_spectrum'][0])
    resp=[]
    
    for sid in sensor_ids:
        temp=[]
        for i in range(N):
            temp.append({"x":str(int(sid)-1), "y": str(data[sid]['power_spectrum'][0][i])})
        resp.append(temp)
    resp=make_response(jsonify(resp))
    resp.set_cookie('st',ndt)
    resp.set_cookie('valid_till',exp_time)
    return resp

@app.route('/api/streamgraph/<st>/<ndt>')
def streamgraph(st,ndt):
    # curr_time,st,ndt=getStartEndTime(request.cookies)
    # exp_time=formatDate(curr_time+timedelta(minutes=5))
    data=total_data_in_time_range(st,ndt)

    freqs,data=data['freqs'],data['data']
    sensor_ids=data.keys()
    N=len(data[sensor_ids[0]]['timestamp'])
    resp={'start_time': st,'data':[],'ticks':'5'}
    
    for i in range(N):
        temp={}
        for sid in sensor_ids:
            temp[sid]=data[sid]['average_power'][i]
        resp['data'].append(temp)

    return make_response(jsonify(resp))


# @socketio.on('connect', namespace='/stream')
# def test_connect():
#     emit('my response', {'data': 'Connected'})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
