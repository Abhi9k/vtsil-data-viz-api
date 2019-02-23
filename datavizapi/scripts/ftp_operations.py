import os
from ftplib import FTP
from datetime import datetime

TEMP_FILE_PATH = './.lastread'
CREDENTIALS_FILE = './.credentials'
DATE_TIME_FORMAT = '%Y-%m-%d_%H_%M_%S'
DESTINATION_DIR = './'


def getUsernamePassword():
    lines = open(CREDENTIALS_FILE, 'r').readlines()
    lines = map(lambda l: l.strip('\n '), lines)
    return (lines[0], lines[1])


def getLastReadDate():
    resp = None
    try:
        with open(TEMP_FILE_PATH, 'r') as f:
            line = f.readlines()[0]
            line = line.strip('\n ')
            resp = datetime.strptime(line, DATE_TIME_FORMAT)
    except IOError:
        pass
    return resp


def connectAndGetFTP(host='10.0.1.8', port=8000):
    username, password = getUsernamePassword()
    ftp = FTP()
    ftp.set_debuglevel(0)
    ftp.connect(host, port)
    ftp.login(username, password)
    ftp.set_pasv(True)
    return ftp


def getFileMetadata(ftp):
    this = getFileMetadata
    this.data = []

    def cb(d):
        getFileMetadata.data.append(d)
    ftp.retrlines('LIST', cb)

    this.data = map(lambda d: d.split(), this.data)
    this.data = map(lambda d: [d[0] + " " + d[1]] + d[2:], this.data)
    return this.data


def fetchConfigFile(ftp):
    this = fetchConfigFile
    this.files = []
    ftp.retrlines('LIST', lambda d: this.files.append(d))
    this.files = map(lambda x: x.split()[-1], this.files)
    config_fname = filter(lambda x: x.endswith('config.txt'), this.files)[0]

    ofile = open(config_fname, 'wb')
    ftp.retrbinary('RETR ' + config_fname, ofile.write)
    ofile.close()
    return config_fname


def filterUnfetchedRecords(last_date, records):
    records = filter(lambda x: not x[-1].endswith('txt'), records)
    if last_date is None:
        return records
    return filter(
        lambda r: datetime.strptime(r[-1][:-3], DATE_TIME_FORMAT) > last_date,
        records)


def fetchFiles(ftp, records):
    for r in records:
        while True:
            try:
                ofile = open(os.path.join(DESTINATION_DIR, r[-1]), 'wb')
                ftp.retrbinary('RETR ' + r[-1], ofile.write)
                ofile.close()
                break
            except Exception, e:
                print(e)
                pass


def updateLastReadDate(records):
    if len(records) == 0:
        return
    dates = map(
        lambda r: datetime.strptime(r[-1][:-3], DATE_TIME_FORMAT), records)
    dates = sorted(dates, reverse=True)
    with open(TEMP_FILE_PATH, 'w') as f:
        f.write(datetime.strftime(dates[0], DATE_TIME_FORMAT))
