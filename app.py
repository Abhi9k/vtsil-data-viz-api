from flask import Flask, jsonify, request, url_for,render_template,make_response

app = Flask(__name__,static_url_path='',static_folder='web/',template_folder='templates')


@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
