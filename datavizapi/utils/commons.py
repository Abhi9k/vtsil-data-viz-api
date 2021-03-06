import time_utils
from confluent_kafka import Producer
from datavizapi import AppConfig

config = AppConfig().getConfig()


def splitRangeInHours(start_time, end_time):
    dates = []
    d = time_utils.roundToHour(start_time)
    dates.append(d)
    if start_time == end_time:
        return dates
    while d <= end_time:
        d = time_utils.editedTime(d, seconds=3600)
        dates.append(d)
    return dates


def splitRangeInMinutes(start_time, end_time):
    dates = []
    d = time_utils.roundToMinute(start_time)
    dates.append(d)
    if start_time == end_time:
        return dates
    while d <= end_time:
        d = time_utils.editedTime(d, seconds=60)
        dates.append(d)
    return dates


def splitRangeInSeconds(start_time, end_time):
    dates = []
    d = start_time
    while d <= end_time:
        dates.append(d)
        d = time_utils.editedTime(d, seconds=1)
    return dates


def produceToKafka(topic, message):
    p = Producer({'bootstrap.servers': ",".join(config['kafka']['servers'])})
    p.produce(topic, message, partition=0)
    p.poll(1)
