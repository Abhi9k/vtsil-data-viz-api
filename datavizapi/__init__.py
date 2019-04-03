import yaml
import os

env = os.environ['APP_ENV'] or 'dev'


class AppConfig():
    def __init__(self):
        self.config = yaml.load(open('config.yml', 'r'))
        if env == 'dev':
            self.config['cassandra']['nodes'] = ['localhost']
            self.config['kafka']['servers'] = ['localhost']

    def getConfig(self):
        return self.config
