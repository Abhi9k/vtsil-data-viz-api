from flask import Flask,jsonify,request

from psd import (small_sample_dataset,total_data_in_time_range,
	average_power_in_time_range,average_power_in_time_range_in_freq_range)
from sensor_metadata import get_sensor_metadata


app=Flask(__name__)

@app.route('/')
def index():
	return jsonify(go_to="/api/dataset/small")

@app.route('/api/sample/<count>')
def get_small_dataset(count=1):
	count=int(request.args.get("count",count))
	count=min(count,2000)
	return jsonify(small_sample_dataset(count))

@app.route('/api/avg_power/<start>/<end>/<f1>/<f2>')
def get_energy_history_in_time_range_in_freq_range(start,end,f1,f2):
	return jsonify(average_power_in_time_range_in_freq_range(start,end,f1,f2))

@app.route('/api/all/<start>/<end>')
def psd_data_in_time_range(start,end):
	return jsonify(total_data_in_time_range(start,end))

@app.route('/api/avg_power/<start>/<end>')
def psd_data_avg_power_in_time_range(start,end):
	return jsonify(average_power_in_time_range(start,end))

@app.route('/api/sensor_info/<daq_id>')
def get_sensor_info(daq_id):
	return jsonify(get_sensor_metadata(daq_id))




if __name__=='__main__':
	app.run(debug=True,host='0.0.0.0',port=8000)