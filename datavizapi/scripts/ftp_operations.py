import os
import time
from ftplib import FTP
from datetime import datetime
from datavizapi import AppConfig

config = AppConfig().getConfig()

ftp_config = config['file_sync']

TEMP_FILE_PATH = ftp_config['temp_file_path']
CREDENTIALS_FILE = ftp_config['credentials_file_path']
DATE_TIME_FORMAT = ftp_config['file_name_format']
DESTINATION_DIR = ftp_config['destination_dir']
SCRIPT_BASE_PATH = os.path.dirname(os.path.realpath(__file__))


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


def connectAndGetFTP(host=ftp_config['ftp_remote_ip'], port=ftp_config['ftp_remote_port']):
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
        retries = 0
        while True:
            try:
                ofile = open(os.path.join(SCRIPT_BASE_PATH, r), 'wb')
                ftp.retrbinary('RETR ' + r, ofile.write)
                ofile.close()
                break
            except Exception:
                retries += 1
                if retries > 5:
                    break
                else:
                    time.sleep(0.2)
                pass


def updateLastReadDate(records):
    if len(records) == 0:
        return
    dates = map(
        lambda r: datetime.strptime(r[-1][:-3], DATE_TIME_FORMAT), records)
    dates = sorted(dates, reverse=True)
    with open(TEMP_FILE_PATH, 'w') as f:
        f.write(datetime.strftime(dates[0], DATE_TIME_FORMAT))
