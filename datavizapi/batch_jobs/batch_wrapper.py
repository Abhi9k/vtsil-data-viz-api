import datavizapi.cassandra_operations as db_op
from datavizapi.utils import time_utils
from collections import OrderedDict, defaultdict
import numpy as np
import time


def flat_map(r, key):
    resp = []
    for item in r:
        resp.extend(key(item))
    return resp


def create_csv(fname, record_size, records):
    csv_file_name = fname + ".csv"
    f = open(csv_file_name, 'w')
    keys = records.keys()
    records = {k: flat_map(v, lambda x: x['data']) for k, v in records.items()}
    for i in range(record_size):
        vals = [records[k][i] for k in keys]
        vals = map(str, vals)
        f.write(",".join(vals) + "\n")
    f.close()
    return csv_file_name


def create_matrix(record_size, records):
    keys = records.keys()
    records = {k: flat_map(records[k], lambda x: x['data']) for k in keys}
    mat = np.empty([record_size, len(keys)])
    for i in range(len(keys)):
        mat[:, i] = records[keys[i]][:record_size]
    return mat


def fetch_data(end_time, duration, fs, output_type, is_sliding, sids=None):
    t = 0
    while t < 2:
        start_time = time_utils.editedTime(end_time, is_utc=True, seconds=-1 * duration)
        future_results = db_op.fetchSensorData(start_time, end_time)
        records = defaultdict(list)
        for future in future_results:
            result = future.result()
            for row in result:
                if (sids is None) or row['id'] in sids:
                    records[row['id']].append(row)
        records = OrderedDict(sorted(records.items(), key=lambda x: x[0]))
        print(len(records))
        if output_type == 'matrix':
            response = create_matrix(fs * duration, records)
        # elif output_type == 'csv':
        #     response = create_csv(job_name + "_" + str(fs) + "_" + str(t), fs * duration, records)
        if is_sliding:
            end_time = time_utils.editedTime(end_time, is_utc=True, seconds=1)
        else:
            end_time = time_utils.editedTime(end_time, is_utc=True, seconds=duration)
            time.sleep(duration)
        t += 1
        yield response
