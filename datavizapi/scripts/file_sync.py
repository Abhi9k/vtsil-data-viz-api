from ftplib import FTP
from datetime import datetime
import os
import time
import json
from confluent_kafka import Producer

p = Producer({'bootstrap.servers': 'node0,node1,node2'})

TEMP_FILE_PATH = './.lastread'
CREDENTIALS_FILE = './.credentials'
DATE_TIME_FORMAT = '%Y-%m-%d_%H_%M_%S'
DESTINATION_DIR = './'
SCRIPT_BASE_PATH = os.path.dirname(os.path.realpath(__file__))

def delivery_report(err, msg):
    """ Called once for each message produced to indicate delivery result.
        Triggered by poll() or flush(). """
    if err is not None:
        print('Message delivery failed: {}'.format(err))
    else:
        print('Message delivered to {} [{}]'.format(msg.topic(), msg.partition()))

def getUsernamePassword():
    lines = open(CREDENTIALS_FILE, 'r').readlines()
    lines = map(lambda l: l.strip('\n '), lines)
    return (lines[0],lines[1])

def getLastReadDate():
    resp = None
    try:
        with open(TEMP_FILE_PATH, 'r') as f:
            line=f.readlines()[0]
            line=line.strip('\n ')
            resp = datetime.strptime(line, DATE_TIME_FORMAT)
    except IOError, e:
        pass
    return resp

def connectAndGetFTP(host='10.0.1.8', port=8000):
    username,password = getUsernamePassword()
    ftp = FTP()
    ftp.set_debuglevel(0)
    ftp.connect(host, port)
    ftp.login(username, password)
    ftp.set_pasv(True)
    return ftp

def getFileMetadata(ftp):
    this = getFileMetadata
    this.data=[]
    def cb(d):
        getFileMetadata.data.append(d)
    ftp.retrlines('LIST', cb)

    this.data = map(lambda d: d.split(), this.data)
    this.data = map(lambda d: [d[0]+" "+d[1]]+d[2:], this.data)
    return this.data

def parseSampleRateFromConfig(fname):
    sample_rate = None
    with open(fname, 'r') as f:
        lines = f.readlines()
        sample_rate_line = filter(lambda x: x.startswith('real sample rate'), lines)[0]
        sample_rate = sample_rate_line.split('=')[-1].strip(' \n\r')
    return sample_rate

def fetchConfigFile(ftp):
    this = fetchConfigFile
    this.files = []
    ftp.retrlines('LIST', lambda d: this.files.append(d))
    this.files = map(lambda x: x.split()[-1], this.files)
    config_fname = filter(lambda x: x.endswith('config.txt'), this.files)[0]

    ofile = open(config_fname, 'wb')
    ftp.retrbinary('RETR '+config_fname, ofile.write)
    ofile.close()
    return config_fname

def filterUnfetchedRecords(last_date, records):
    records = filter(lambda x: not x[-1].endswith('txt'), records)
    if last_date is None:
        return records
    return filter(
        lambda r: datetime.strptime(r[-1][:-3], DATE_TIME_FORMAT)>last_date,
        records)

def fetchFiles(ftp, records):
    for r in records:
        while True:
            try:
                ofile = open(os.path.join(DESTINATION_DIR, r[-1]), 'wb')
                ftp.retrbinary('RETR '+r[-1], ofile.write)
                ofile.close()
                break
            except Exception,e:
                print(e)
                pass

def updateLastReadDate(records):
    if len(records) == 0:
        return
    dates = map(lambda r: datetime.strptime(r[-1][:-3], DATE_TIME_FORMAT), records)
    dates = sorted(dates, reverse=True)
    with open(TEMP_FILE_PATH, 'w') as f:
        f.write(datetime.strftime(dates[0], DATE_TIME_FORMAT))

def putNewfilenames(data, sample_rate):
    if len(data) == 0:
        return
    data = map(lambda x: SCRIPT_BASE_PATH+"/"+x[-1], data)
    for d in data:
        payload = {
            "sample_rate": sample_rate,
            "file_name": d
        }
        p.produce('incomingFiles', json.dumps(payload), callback=delivery_report)
    p.poll(1)

while True:
    last_date = getLastReadDate()
    ftp = connectAndGetFTP()
    ftp.cwd('data')
    config_fname = fetchConfigFile(ftp)
    sample_rate = parseSampleRateFromConfig(config_fname)
    records = getFileMetadata(ftp)
    records = filterUnfetchedRecords(last_date, records)
    fetchFiles(ftp, records)
    updateLastReadDate(records)
    ftp.quit()
    ftp.close()
    putNewfilenames(records, sample_rate)
    time.sleep(1)

