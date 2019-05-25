#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Mar 20 15:12:33 2017

@author: Vast2
"""

from __future__ import division, print_function
from detect_peaks import detect_peaks
from datetime import datetime, timedelta
from datavizapi.cassandra_operations import fetchSensorDataPerMinute
from cassandra import ReadTimeout
from datavizapi.utils.time_utils import formatTime
import h5py
import datavizapi.constants as constants
import time
import gc
import pytz
import numpy as np
import scipy.signal as signal
import scipy.linalg as linalg
from collections import defaultdict
# import os
# sys.path.insert(1, os.path.abspath('functions'))  # add to pythonpath

def readH5(fname):
    f = h5py.File(fname, 'r')
    data = f['/Data']
    keys = data.keys()
    n_sample = len(data.get(keys[0]).value.flatten())
    response = np.empty([n_sample, len(keys)])
    for i, k in enumerate(keys):
        response[:, i] = data.get(k).value.flatten()
    f.close()
    return response, keys


# sids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16], 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 51, 52, 54, 55, 56, 57, 58, 59, 74, 76, 77, 78, 79, 80, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 95, 96, 97, 98, 99, 100, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 122, 123, 124, 125, 126, 127, 128, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 161, 162, 163, 165, 166, 168, 169, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 254, 255, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271]
def readFromDB(from_ts, to_ts):
    future_results = []
    future_results.extend(fetchSensorDataPerMinute(from_ts, to_ts))
    data = defaultdict(list)
    for future in future_results:
        result = future.result()
        for row in result:
            data[row['id']].append(row)
    keys = data.keys()
    n_channels = len(keys)
    n_samples = len(data[keys[0]][0]['data']) * len(data[keys[0]])
    response = np.empty([n_samples, n_channels])
    for i in range(n_channels):
        temp = []
        for d in data[keys[i]]:
            temp += d['data']
        response[:, i] = temp
    return response, keys, n_samples


# def modalAnalysis(fname, sample_rate, r, num_modes, f_lim, sample_size):
#     data, daq_keys = readH5(fname)
#     # daq_names = map(lambda x: x[5:], daq_keys)
#     # n_chanel = len(data[0, :])
#     # n_sample = len(data[:, 0])
#     print(data.shape)
#     data_p, t = preProcess(data, sample_rate, r, 1.5)
#     fs = sample_rate / np.prod(r)
#     print(data_p.shape)
#     df = fs / sample_size
#     svd_res = fs / (2 * df)
#     wdw_size = svd_res * 2
#     fy, gy = csdSpec(data_p, fs, wdw_size)
#     freq, U, sig, fy_lim, peak_i = fdd(fy, gy[:, :, :], fs, num_modes, f_lim)
#     print(freq)

def modalAnalysis(from_ts, to_ts, sample_rate, r, num_modes, f_lim):
    data, daq_keys, sample_size = readFromDB(from_ts, to_ts)
    # daq_names = map(lambda x: x[5:], daq_keys)
    # n_chanel = len(data[0, :])
    # n_sample = len(data[:, 0])
    print(data.shape)
    data_p, t = preProcess(data, sample_rate, r, 1.5)
    fs = sample_rate / np.prod(r)
    print(data_p.shape)
    # df = fs / sample_size
    # svd_res = fs / (2 * df)
    wdw_size = 2048
    fy, gy = csdSpec(data_p, fs, wdw_size)
    freq, U, sig, fy_lim, peak_i = fdd(fy, gy[:, :, :], fs, num_modes, f_lim)
    return freq


def preProcess(data, fs, r, fc):
    """ Inputs:
            data - data matrix
            fs - sampling rate (Hz)
            r - decimation array, specifies subsequent decimation factor (for efficiency)
            fc - cuttoff frequency (Hz)

        Output:
            datap - processed data
            t - time vector
    """
    print('Preprocessing data...')
    axis = 0
    datap = signal.detrend(data, axis, 'linear')
    # decimate columns
    if r != 1:
        for fact in r:
            datap = signal.decimate(datap, fact, None, 'iir', axis, True)

    # filter columns
    # normalized cuttoff frequency
    wc = fc * 2 * np.prod(r) / fs
    b, a = signal.butter(4, wc, 'highpass', False, 'ba')

    datap = signal.filtfilt(b, a, datap, axis, 'even', None, 'gust', datap.shape[0] / 2)
    # create time vector
    dataSize = datap.shape
    step = np.prod(r) / fs
    period = dataSize[0] * step
    t, step_out = np.linspace(0, period, dataSize[0], False, True)

    if step != step_out:
        print('Something went wrong creating the time vector!')

    return datap, t


def csdSpec(y, fs, nfft):
    print('Calculating Gy...')
    dimy = y.shape

    if np.mod(nfft, 2) == 0:
        nf = int(nfft / 2 + 1)
    else:
        nf = int((nfft + 1) / 2)
    # Calculate the SD matrix, Gy
    Gy = np.zeros([nf, dimy[1], dimy[1]], 'complex')
    count = 0
    for r in range(dimy[1]):
        for c in range(r, dimy[1]):
            count += 1
            fy, Pxy = signal.csd(y[:, r], y[:, c], fs, 'hann', nfft)
            Gy[:, r, c] = Pxy

            if r != c:
                Gy[:, c, r] = Pxy

            print('Progress: {0}/{1} '.format(
                str(count), str(int((dimy[1]**2) / 2 + dimy[1] / 2))), end="\r")

    return fy, Gy


def fdd(fy, Gy, fs, numModes=None, flim=None):
    print('FDD...')

    # ====== Limit Frequencies ============
    if flim is None:
        flim = [fy[0], fy[-1]]

    fmin_i = np.argmin(np.absolute(fy - flim[0]))
    fmax_i = np.argmin(np.absolute(fy - flim[1]))
    fy_lim = fy[fmin_i: fmax_i]

    # ======= Frequency bounded SVD ======
    Glim = Gy[fmin_i:fmax_i, :, :]
    dimG = Glim.shape
    U = np.zeros([dimG[0], dimG[1], dimG[1]], 'complex')
    V = np.zeros([dimG[0], dimG[2], dimG[2]], 'complex')
    sig = np.zeros([dimG[0], dimG[2]], 'float')

    for fbin in range(dimG[0]):
        G_slice = Glim[fbin, :, :]
        U[fbin, :, :], sig[fbin, :], V[fbin, :, :] = linalg.svd(G_slice)
        print('Progress: {0}/{1} '.format(str(fbin + 1), str(dimG[0])), end="\r")
    print('')

    # ======== Find Peaks ==============
    sig1 = sig[:, 0]
    max_val = max(sig1)
    min_val = min(sig1)
    # minimum frequency distance b/w peaks
    min_freq_dist = .2
    min_ind_dist = int(np.floor(min_freq_dist / (fy[1] - fy[0])))

    peak_i = detect_peaks(
        sig1, mph=.1 * (max_val - min_val), mpd=min_ind_dist, show=False)
    peak_sig = sig1[peak_i]

    peak_sort_i = np.argsort(-peak_sig)
    if numModes is None or numModes > len(peak_sort_i):
        numModes = len(peak_sort_i)
    ind_sel = np.sort(peak_sort_i[0: numModes])
    peak_freq = fy_lim[peak_i[ind_sel]]

    # ======= Calculate Modes ==========
    U_sel = np.zeros([dimG[1], len(peak_freq)], 'complex')
    for k in ind_sel:
        U_sel[:, k] = U[k, :, 0]

    return peak_freq, U_sel, sig, fy_lim, peak_i


local_tz = pytz.timezone('US/Eastern')
start_time = datetime(2019, 4, 27, 03, 23, 20)
start_time_local = local_tz.localize(start_time)
start_time_utc = start_time_local.astimezone(pytz.utc)

end_time = datetime(2019, 4, 27, 23, 0, 0)
end_time_local = local_tz.localize(end_time)
end_time_utc = end_time_local.astimezone(pytz.utc)
to_ts = None
sample_rate, r, num_modes, f_lim = 1024, [4, 4], 3, [1.7, 2.5]
outfile = open('/home/vtsil/oma.csv', 'w')

while True:
    print("started")
    from_ts = to_ts or start_time_utc
    to_ts = from_ts + timedelta(minutes=25)
    if to_ts > end_time_utc:
        break
    while True:
        try:
            strt = datetime.now()
            freq = modalAnalysis(from_ts, to_ts, sample_rate, r, num_modes, f_lim)
            print((datetime.now() - strt).total_seconds())
            break
        except Exception:
            pass
        gc.collect()
        time.sleep(200)
        print("retrying")
    freq = map(str, freq)
    freq = [formatTime(from_ts, constants.APP_TZ, constants.RES_DATE_FORMAT)] + freq
    if len(freq) > 0:
        freq = ",".join(freq)
    else:
        freq = ''
    print(freq)
    outfile.write(freq + "\n")
    outfile.flush()
    time.sleep(90)


# if __name__ == "__main__":
#     fname = sys.argv[1]
#     sample_rate, r, num_modes, f_lim = 1024, [4, 4], 3, [1.7, 2.5]
#     modalAnalysis(fname, sample_rate, r, num_modes, f_lim)
