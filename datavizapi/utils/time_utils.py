from pytz import timezone
import pytz
from datetime import datetime, timedelta

utc_tz = pytz.utc


def roundToHour(d):
    return d.replace(minute=0, second=0, microsecond=0)


def currTime():
    return pytz.utc.localize(datetime.now())


def parseTime(time_str, tz, format):
    local_tz = timezone(tz)
    d = datetime.strptime(time_str, format)
    d_local = local_tz.localize(d)
    d_utc = d_local.astimezone(utc_tz)
    return d_utc


def formatTime(d, tz, format, is_utc=True):
    local_tz = timezone(tz)
    if not is_utc:
        d_utc = utc_tz.localize(d)
    else:
        d_utc = d
    d_local = d_utc.astimezone(local_tz)
    return datetime.strftime(d_local, format)


def editedTime(d, is_utc=True, days=0, seconds=0, microseconds=0):
    if not is_utc:
        d_utc = utc_tz.localize(d)
    else:
        d_utc = d
    new_d_utc = d_utc + timedelta(days=days, seconds=seconds, microseconds=microseconds)
    return new_d_utc
