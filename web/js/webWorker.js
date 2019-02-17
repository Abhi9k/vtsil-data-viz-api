var v1_api='https://gist.githubusercontent.com/Abhi9k/742d87b18d08dae8431047c0141f25b1/raw/83f48e2fb2ce46cf2f5156af8b6f01aad17f29ae/v1.json';
var v2_api='https://gist.githubusercontent.com/Abhi9k/785b7e9c4826a8610d565b16c71a56df/raw/d48f1a2dcd3b12cf6df9e4685190cb9b5feecf09/v2.json';

if( 'function' === typeof importScripts) {
   importScripts("https://d3js.org/d3-fetch.v1.min.js");
   // importScripts("https://d3js.org/d3-array.v2.min.js");
}

onmessage = function(event){
    let msg=event.data;
    if(msg[0]==='updateV1') {
    	d3.json(v1_api).then(function(response) {
    		postMessage(['v1data', response]);
    	});
    }

    if(msg[0]==='updateV2') {
    	d3.json(v2_api).then(function(response) {
    		postMessage(['v2data', response]);
    	});
    }		
};