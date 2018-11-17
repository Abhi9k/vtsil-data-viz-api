import os

from flast import Flask

def create_app():
	app=Flask(__name__, instance_relative_config=True)

	app.config.from_pyfile('config.py', silent=True)

	try:
		os.mkdirs(app.instance_path)
	except OSError:
		pass

	from datavizapi import db
	db.init_app(app)

	# register blueprints

	return app