import os

from flask import (Flask,jsonify)


def create_app():
	@app.route('/')
	def index():
		return jsonify("go to":"/dataset/small")

	app=Flask(__name__, instance_relative_config=True)

	app.config.from_pyfile('config.cfg', silent=True)

	try:
		os.mkdirs(app.instance_path)
	except OSError:
		pass

	from datavizapi import db
	db.init_app(app)

	from datavizapi import psd

	# register blueprints
	app.register_blueprint(psd.bp)

	return app