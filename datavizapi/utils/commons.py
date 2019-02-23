import time_utils


def splitRangeInHours(start_time, end_time):
    dates = []
    d = time_utils.roundToHour(start_time)
    dates.append(d)
    while d <= end_time:
        d = time_utils.editedTime(d, seconds=3600)
        dates.append(d)
    return dates
