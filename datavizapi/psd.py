from db import get_db, execute_one, execute_many
from scipy import integrate
import utils

freqs = "0.0,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,20.0,21.0,22.0,23.0,24.0,25.0,26.0,27.0,28.0,29.0,30.0,31.0,32.0,33.0,34.0,35.0,36.0,37.0,38.0,39.0,40.0,41.0,42.0,43.0,44.0,45.0,46.0,47.0,48.0,49.0,50.0,51.0,52.0,53.0,54.0,55.0,56.0,57.0,58.0,59.0,60.0,61.0,62.0,63.0,64.0,65.0,66.0,67.0,68.0,69.0,70.0,71.0,72.0,73.0,74.0,75.0,76.0,77.0,78.0,79.0,80.0,81.0,82.0,83.0,84.0,85.0,86.0,87.0,88.0,89.0,90.0,91.0,92.0,93.0,94.0,95.0,96.0,97.0,98.0,99.0,100.0,101.0,102.0,103.0,104.0,105.0,106.0,107.0,108.0,109.0,110.0,111.0,112.0,113.0,114.0,115.0,116.0,117.0,118.0,119.0,120.0,121.0,122.0,123.0,124.0,125.0,126.0,127.0,128.0"


def small_sample_dataset(count):
    rows = execute_one(
        """SELECT daq_id, timestamp, average_power, power_spectrum
		 FROM psd ORDER BY timestamp LIMIT %s""", (count, ))
    group_by_daq_id = {}
    for row in rows:
        daq_id = row[0]
        if daq_id not in group_by_daq_id:
            group_by_daq_id[daq_id] = {
                'timestamp': [],
                'average_power': [],
                'power_spectrum': []
            }

        group_by_daq_id[daq_id]['timestamp'].append(row[1])
        group_by_daq_id[daq_id]['average_power'].append(row[2])
        group_by_daq_id[daq_id]['power_spectrum'].append(row[3].split(","))
    return {'freqs': freqs.split(","), 'data': group_by_daq_id}


def total_data_in_time_range(start_time, end_time):
    rows = execute_one(
        """SELECT daq_id, timestamp, average_power, power_spectrum
		 FROM psd WHERE timestamp>=%s and timestamp<=%s ORDER BY timestamp""",
        (start_time, end_time))
    group_by_daq_id = {}
    for row in rows:
        daq_id = row[0]
        if daq_id not in group_by_daq_id:
            group_by_daq_id[daq_id] = {
                'timestamp': [],
                'average_power': [],
                'power_spectrum': []
            }

        group_by_daq_id[daq_id]['timestamp'].append(row[1])
        group_by_daq_id[daq_id]['average_power'].append(row[2])
        group_by_daq_id[daq_id]['power_spectrum'].append(row[3].split(","))
    return {'freqs': freqs.split(","), 'data': group_by_daq_id}


def average_power_in_time_range(start_time, end_time):
    data = total_data_in_time_range(start_time, end_time)
    for k in data['data']:
        del data['data'][k]['power_spectrum']
    del data['freqs']
    return data['data']


def average_power_in_time_range_in_freq_range(start_time, end_time, f1, f2):
    raw_data = total_data_in_time_range(start_time, end_time)
    fs = map(lambda x: float(x), raw_data['freqs'])
    s_idx = -1
    e_idx = -1
    f1, f2 = float(str(f1)), float(str(f2))
    for i, f in enumerate(fs):
        if f1 <= f and s_idx == -1:
            s_idx = i
        if f2 <= f and e_idx == -1:
            e_idx = i
    print f1, f2, s_idx, e_idx

    if s_idx == -1 or e_idx == -1:
        return {
            "error":
            "Invalid frequency values. Frequencies should be between {} to {}".
            format(fs[0], fs[-1])
        }
    s_idx, e_idx = min(s_idx, e_idx), max(s_idx, e_idx)
    for k, v in raw_data['data'].items():
        v['average_power'] = []
        p_spectrum = v['power_spectrum']
        for p_s in p_spectrum:
            spectrum = p_s[s_idx:e_idx + 1]
            spectrum = map(lambda x: float(x), spectrum)
            v['average_power'].append(integrate.simps(spectrum))
        del v['power_spectrum']
    del raw_data['freqs']
    return raw_data['data']
