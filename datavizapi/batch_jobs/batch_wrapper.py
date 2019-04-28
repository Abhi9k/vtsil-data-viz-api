import sys
import os
sys.path.append('/home/vtsil/vtsil-data-viz-api')
import datavizapi.cassandra_operations as db_op
import datavizapi.constants as Constants
from datavizapi.utils import time_utils
import numpy as np
import time


std = 0.000000008546

footstep_script_commands = "./datavizapi/batch_jobs/run_footstepLocalization.sh /usr/local/MATLAB/MATLAB_Runtime/v95 /home/vtsil/vtsil-data-viz-api/{0} /home/vtsil/vtsil-data-viz-api/datavizapi/batch_jobs/footstep_sensor_coords.csv {1} {2}"


def flat_map(r, key):
    resp = []
    for item in r:
        resp.extend(key(item))
    return resp


def create_csv(fname, record_size, records):
    csv_file_name = fname + ".csv"
    f = open(csv_file_name, 'w')
    keys = records.keys()
    records = {k: flat_map(v, lambda x: x.data) for k, v in records.items()}
    for i in range(record_size):
        vals = [records[k][i] for k in keys]
        vals = map(str, vals)
        f.write(",".join(vals) + "\n")
    f.close()
    return csv_file_name


def create_matrix(record_size, records):
    keys = records.keys()
    records = {k: flat_map(v, lambda x: x.data) for k, v in records.items()}
    mat = np.empty([record_size, len(records)])
    for i in range(len(records)):
        mat[:, i] = records[keys[i]]
    return mat


if __name__ == '__main__':
    job_name = sys.argv[1]
    start_ts = sys.argv[2].strip('\'')
    duration = int(sys.argv[3])
    fs = int(sys.argv[4])
    output_type = sys.argv[5]
    is_sliding = int(sys.argv[6])

    b = time_utils.parseTime(start_ts, Constants.APP_TZ, Constants.RES_DATE_FORMAT)
    t = 0
    while t < 2:
        a = time_utils.editedTime(b, is_utc=True, seconds=-1 * duration)
        records = db_op.fetchSensorData(a, b)
        print(len(records))
        if output_type == 'matrix':
            response = create_matrix(fs * duration, records)
        elif output_type == 'csv':
            response = create_csv(job_name + "_" + str(fs) + "_" + str(t), fs * duration, records)
            print(footstep_script_commands.format(response, std, fs))
            os.system(footstep_script_commands.format(response, std, fs))
        if is_sliding:
            b = time_utils.editedTime(b, is_utc=True, seconds=1)
        else:
            b = time_utils.editedTime(b, is_utc=True, seconds=duration)
            time.sleep(duration)
        t += 1
