var power_data={};
var heat_map_data=[];
var series_data=[];
if( 'function' === typeof importScripts) {
   importScripts("https://d3js.org/d3-fetch.v1.min.js");
   // importScripts("https://d3js.org/d3-array.v2.min.js");
}
var stream_url='http://128.173.25.223:8000/api/stream';
// var stream_url="https://gist.githubusercontent.com/Abhi9k/fd42790832730fa2c6d397afd8b4335a/raw/26ee2ca025e144acff04ac712bce46cb67e50e84/data.json";
var series_url="http://128.173.25.223:8000/api/bargraph";
var streamgraph_url="http://128.173.25.223:8000/api/streamgraph/2017-12-02 13:00:00/2017-12-02 13:30:00";
var streamgraph_base_url="http://128.173.25.223:8000/api/streamgraph/";
var sensor_info_base_url="http://128.173.25.223:8000/api/sensor_info/";
var timeseries_base_url="http://128.173.25.223:8000/api/avg_power/"
onmessage = function(event){
    let msg=event.data;
    if(msg[0]==="initData") {
    	d3.json(stream_url).then(function(resp){
	    	let data=resp.data;
	    	let freqs=resp.freqs;
		    for(let i=1;i<=197;i++){
		        power_data[i]=data[i]['average_power'][0];
		        for(let j=0;j<data[i]['power_spectrum'][0].length;j++) {
		            heat_map_data[(i-1)*129 + j]=[i,freqs[j],data[i]['power_spectrum'][0][j]];
		        }
		    }
		    postMessage(["initData",power_data,heat_map_data]);	
    	});
    }

    if(msg[0]==="updateStream") {
		d3.json(stream_url).then(function(resp) {
	    	let data=resp.data;
	    	let freqs=resp.freqs;
		    for(let i=1;i<=197;i++){
		        power_data[i]=data[i]['average_power'][0];
		        for(let j=0;j<data[i]['power_spectrum'][0].length;j++) {
		            heat_map_data[(i-1)*129 + j]=[i,freqs[j],data[i]['power_spectrum'][0][j]];
		        }
		    }
		    postMessage(["updateStream",power_data,heat_map_data]);
		});
	}

    if(msg[0]==="updateSeries") {
		d3.json(series_url).then(function(resp) {
			postMessage(["updateSeries",resp]);});
	}

	if(msg[0]==="updateStreamGraph") {

		url=streamgraph_base_url+msg[1];
		d3.json(url).then(function(resp) {
			postMessage(["updateStreamGraph",resp]);});
	}  

	if(msg[0]==="sensorMetadata") {

		d3.json(sensor_info_base_url+msg[1]).then(function(resp) {
			postMessage(["sensorMetadata",msg[1],resp]);
		});
	}

	if(msg[0]==="timeseriesData") {
		url=timeseries_base_url+msg[1];
		d3.json(url).then(function(resp) {
			postMessage(["timeseriesData",resp]);
		} );

	}
				
};