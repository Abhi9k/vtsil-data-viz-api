import sys
sys.path.append('/home/vtsil/vtsil-data-viz-api')
import datavizapi.cassandra_operations as db_op
from datavizapi.utils.time_utils import parseTime
import datavizapi.constants as constants
import json

sids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 51, 52, 54, 55, 56, 57, 58, 59, 74, 76, 77, 78, 79, 80, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 95, 96, 97, 98, 99, 100, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 122, 123, 124, 125, 126, 127, 128, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 161, 162, 163, 165, 166, 168, 169, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 254, 255, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271]


def wrapper(f):
    def fetchBySid(sid, from_ts, to_ts):
        return f(from_ts, to_ts, sids=[sid], descending=False)
    return fetchBySid


def fetch(sid, from_ts, to_ts):
    return db_op.fetchSensorData(from_ts, to_ts, sids=[sid], descending=False)


if __name__ == '__main__':
    args = map(int, sys.argv[1].split(','))
    from_ts = parseTime(sys.argv[2], constants.APP_TZ, constants.RES_DATE_FORMAT)
    to_ts = parseTime(sys.argv[3], constants.APP_TZ, constants.RES_DATE_FORMAT)
    chunk_size = len(sids) / args[1]
    start = args[0] * chunk_size
    if(len(sids) - start) < 2 * chunk_size:
        chunk_size = len(sids) - start
    response = {}
    for sid in sids[start: start + chunk_size]:
        response.update(fetch(sid, from_ts, to_ts))
    for key in response:
        temp = []
        for d in response[key]:
            temp.append(d.data)
        response[key] = temp
    print(json.dumps(response)),