from flask import current_app, g
from flask_mysqldb import MySQL

def get_db():
	if db not in g:
		g.db = MySQL(current_app)
	return g.db

def close_db():
	db = g.pop('db', None)
	if db is not None:
		db.close()

def init_db():
	db = get_db()
	with current_app.open_resource('schema.sql') as f:
		pass

def init_app(app):
	app.teardown_appcontext(close_db)

