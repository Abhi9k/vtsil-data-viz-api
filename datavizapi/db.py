import MySQLdb
from config import config

db=MySQLdb.connect(user=config['DATABASE_USER'],
    passwd=config['DATABASE_PASSWORD'],db=config['DATABASE_NAME'])

def connect():
	global db
	db=MySQLdb.connect(user=config['DATABASE_USER'],
	    passwd=config['DATABASE_PASSWORD'],db=config['DATABASE_NAME'])

def get_db():
	global db
	return db

def query(func):
	def wrapper(*args, **kwargs):
		try:
			return func(*args,**kwargs)
		except MySQLdb.OperationalError:
			connect()
			return func(*args,**kwargs)
	return wrapper


@query
def execute_one(q_string, params=()):
	cursor=db.cursor()
	cursor.execute(q_string, params)
	resp=cursor.fetchall()
	cursor.close()
	return resp

@query
def execute_many(q_string, params=[]):
	cursor=db.cursor()
	cursor.executemany(q_string,params)
	resp=cursor.fetchall()
	cursor.close()
	return resp






# def close_db(e=None):
# 	db = g.pop('db', None)
# 	if db is not None:
# 		db.close()

# def init_db():
# 	db = get_db()
# 	with current_app.open_resource('schema.sql') as f:
# 		pass

# def init_app(app):
# 	app.teardown_appcontext(close_db)

