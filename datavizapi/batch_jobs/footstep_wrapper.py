import sys
import os
import numpy as np
from collections import OrderedDict, defaultdict
sys.path.append('/home/vtsil/vtsil-data-viz-api')
import datavizapi.constants as Constants
from datavizapi.utils import time_utils
from datavizapi.batch_jobs.batch_wrapper import fetch_data, create_matrix
import datavizapi.cassandra_operations as db_op
from datavizapi import AppConfig

config = AppConfig().getConfig()

footstep_script_commands = "./datavizapi/batch_jobs/run_footstepLocalization.sh /usr/local/MATLAB/MATLAB_Runtime/v95 /home/vtsil/vtsil-data-viz-api/{0} /home/vtsil/vtsil-data-viz-api/datavizapi/batch_jobs/footstep_sensor_coords.csv /home/vtsil/vtsil-data-viz-api/{1} {2}"


def footstep_sensor_name_to_id():
    objs = db_op.getSensorInfoAll()
    sensor_names = config['footstep_sensor_names']
    name_to_id = {obj.name: obj.id for obj in objs if obj.name in sensor_names}
    return name_to_id


def no_activity_threshold(from_ts, to_ts, fs, sids):
    from_time = time_utils.parseTime(from_ts, Constants.APP_TZ, Constants.RES_DATE_FORMAT)
    to_time = time_utils.parseTime(to_ts, Constants.APP_TZ, Constants.RES_DATE_FORMAT)
    duration = int((to_time - from_time).total_seconds())

    future_results = db_op.fetchSensorData(from_time, to_time)
    records = defaultdict(list)
    for future in future_results:
        result = future.result()
        for row in result:
            if row['id'] in sids:
                records[row['id']].append(row)
    records = OrderedDict(sorted(records.items(), key=lambda x: x[0]))
    data = create_matrix(fs * duration, records)
    data = data - np.mean(data, axis=0)
    return np.reshape(np.std(data, axis=0), (1, len(records)))


if __name__ == '__main__':

    start_ts = sys.argv[1].strip('\'')
    fs = int(sys.argv[2])
    duration = 1

    end_time = time_utils.parseTime(start_ts, Constants.APP_TZ, Constants.RES_DATE_FORMAT)
    sids = footstep_sensor_name_to_id().values()
    sids = sorted(sids)

    threshold = no_activity_threshold('2019-04-27 03:00:00', '2019-04-27 03:00:10', fs, sids)
    threshold_data_fname = 'threshold.csv'
    np.savetxt(threshold_data_fname, threshold, delimiter=',')

    for response in fetch_data(end_time, duration, fs, 'matrix', 1, sids):
        response = response - np.mean(response, axis=0)
        data_fname = 'footstep_data.csv'
        np.savetxt(data_fname, response, delimiter=',')
        os.system(footstep_script_commands.format(data_fname, threshold_data_fname, fs))
