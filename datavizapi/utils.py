from datetime import datetime, timedelta

SENSOR_DATE_TIME_FORMAT = '%Y-%m-%d %H:%M:%S'
FILENAME_DATE_FORMAT = '%Y-%m-%d_%H_%M_%S'


def parseDate(d, format=FILENAME_DATE_FORMAT):
    return datetime.strptime(d, format)


def formatDate(d, format=SENSOR_DATE_TIME_FORMAT):
    return datetime.strftime(d, format)


def generateTimestamp(start_time, second, format=SENSOR_DATE_TIME_FORMAT):
    days = (second / (60 * 60)) / 24
    hours = (second - days * 60 * 60 * 24) / (60 * 60)
    minutes = (second - days * 60 * 60 * 24 - hours * 60 * 60) / 60
    seconds = (second - days * 60 * 60 * 24 - hours * 60 * 60 - minutes * 60)
    timestamp = formatDate(
        start_time + timedelta(
            days=days, seconds=seconds, minutes=minutes, hours=hours), format)

    return timestamp
