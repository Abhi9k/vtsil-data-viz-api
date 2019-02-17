import h5py
import math
import time
import os
import numpy as np
from datetime import datetime, timedelta
SENSOR_DATE_TIME_FORMAT='%Y-%m-%d %H:%M:%S:%f'
FILENAME_DATE_FORMAT='%Y-%m-%d_%H_%M_%S'

def parseDateFromFilename(fname):
    # example file name 2018-12-13_15_45_31.h5
    return datetime.strptime(fname[:-3], FILENAME_DATE_FORMAT)

def filenameFromDate(d):
    # return os.path.join('D:\mysite', 'data', datetime.strftime(d, FILENAME_DATE_FORMAT) + '.h5')
    return os.path.join('./', 'data', datetime.strftime(d, FILENAME_DATE_FORMAT) + '.h5')

def createH5(start_timestamp, fname, sample_rate):
    infile = h5py.File(fname, 'r')
    dataset = infile['/Data']
    keys = dataset.keys()
    flattened_data=dataset.get(keys[0]).value.flatten()
    n,m = int(math.sqrt(sample_rate)),int(math.sqrt(sample_rate))
    total_seconds = len(flattened_data)/sample_rate
    print(total_seconds)
    for sec in range(total_seconds):
        start_timestamp += timedelta(seconds=1)
        ofilename = filenameFromDate(start_timestamp)
        ofile = h5py.File(ofilename, 'a')
        print(ofilename)
        for key in keys:
            value=dataset.get(key).value.flatten()
            data_arr = []
            for i in range(n):
                data_arr.append(value[sec*n*m+i*m: sec*n*m+i*m+m])
            ofile.create_dataset(
                '/Data/'+key, (n,m), chunks=True,
                compression='gzip', dtype='f', data=np.stack(data_arr, axis=0))
        ofile.flush()
        ofile.close()
        time.sleep(1)

# def readH5(fname):
#     infile = h5py.File(fname, 'r')
#     level_1_group_dataset = infile['/Data']
#     level_2_group_keys = level_1_group_dataset.keys()
#     flattened_data = map(lambda x: (x, level_1_group_dataset.get(x).value.flatten()),
#                          level_2_group_keys)
#     infile.close()
#     return flattened_data

fname='2019-02-16_20_45_31.h5'
# flattened_data = readH5(fname)
start_timestamp = parseDateFromFilename(fname)
createH5(start_timestamp, fname, 256)

