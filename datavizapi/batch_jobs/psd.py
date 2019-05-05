from scipy import signal, integrate
import datavizapi.cassandra_operations as db_op
from datetime import datetime, timedelta
import pytz
from collections import defaultdict

local_tz = pytz.timezone('US/Eastern')
start_time = datetime(2019, 4, 27, 00, 10, 32)
start_time_local = local_tz.localize(start_time)
start_time_utc = start_time_local.astimezone(pytz.utc)

sid_to_data_map = defaultdict(list)


def get_all_sensor_ids():
    objs = db_op.getSensorInfoAll()
    ids = [x.id for x in objs]
    return ids


def power_spectrum(input_arr, sampling_f=256.0,
                   scaling='density', window='hann'):
    window = signal.get_window(window, sampling_f)
    return signal.welch(
        input_arr, fs=sampling_f, scaling=scaling, window=window, nperseg=sampling_f)


def calculate_and_save_psd(from_ts, to_ts, duration):
    raw_data = db_op.fetchSensorDataAsync(from_ts, to_ts)
    for sid, objects in raw_data.items():
        future_results = []
        sampling_freq = None
        for obj in objects:
            sid_to_data_map[sid].extend(obj['data'])
            if sampling_freq is None:
                sampling_freq = len(obj['data'])
        if len(sid_to_data_map[sid]) < duration * sampling_freq:
            continue
        if len(sid_to_data_map[sid]) > duration * sampling_freq:
            sid_to_data_map[sid] = sid_to_data_map[sid][sampling_freq:]
        freqs, power = power_spectrum(sid_to_data_map[sid], sampling_f=sampling_freq)
        average_power = integrate.simps(power)
        future_results.append(db_op.insertPSDAsync(sid, average_power, list(power), to_ts))
    for res in future_results:
        res.result()


while True:
    s = datetime.now()
    calculate_and_save_psd(start_time_utc, start_time_utc, 30)
    print((datetime.now() - s).total_seconds())
    print(start_time_utc)
    start_time_utc = start_time_utc + timedelta(seconds=1)
