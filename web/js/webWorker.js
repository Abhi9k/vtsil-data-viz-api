var sensor_info_api = 'http://128.173.25.223/api/sensor_info';


if( 'function' === typeof importScripts) {
   importScripts("https://d3js.org/d3-fetch.v1.min.js");
}

onmessage = function(event){
    let msg=event.data;
    if(msg[0]==='updateData') {
        var start_time = '2019-04-06 14:08:15';
        var ns = msg[2];
        if(msg[1]) {
            start_time = msg[1];
        }
        var stream_api = `http://128.173.25.223/api/stream?t=${start_time}&ns=${ns}`;
    	d3.json(stream_api).then(function(response) {
    		postMessage(['data', response]);
    	});
    }
    if(msg[0]==='sensorInfo') {
    	d3.json(sensor_info_api).then(function(response) {
    		postMessage(['sensorInfo', response]);
    	});
    }
    if(msg[0]==='floorwise-data') {

    }	
};