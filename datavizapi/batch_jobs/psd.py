from scipy import signal, integrate
import datavizapi.cassandra_operations as db_op
from datetime import datetime, timedelta
import pytz

local_tz = pytz.timezone('US/Eastern')
start_time = datetime(2019, 4, 25, 8, 23, 17)
start_time_local = local_tz.localize(start_time)
start_time_utc = start_time_local.astimezone(pytz.utc)


def power_spectrum(input_arr, sampling_f=256.0,
                   scaling='density', window='hann'):
    window = signal.get_window(window, len(input_arr))
    return signal.welch(
        input_arr, fs=sampling_f, scaling=scaling, window=window)


def calculate_and_save_psd(from_ts, to_ts):
    raw_data = db_op.fetchSensorData(from_ts, to_ts)
    batch = []
    for sid, objects in raw_data.items():
        data = []
        sampling_freq = None
        for obj in objects:
            data.extend(obj.data)
            if sampling_freq is None:
                sampling_freq = len(obj.data)
        freqs, power = power_spectrum(data, sampling_f=sampling_freq)
        average_power = integrate.simps(power)
        batch.append((sid, to_ts, average_power, power))
    db_op.insertPSDBatch(to_ts, batch)


while True:
    prev = start_time - timedelta(seconds=30)
    calculate_and_save_psd(prev, start_time)
    start_time = start_time + timedelta(seconds=1)
