var web_worker,v1_data,v2_data,v3_data,W,H,sensor_info,sid_floor_mapping,f1_sensors,f2_sensors,f3_sensors,f4_sensors,f5_sensors;
var is_first=true;

function onWebWorkerMessage(event) {
    msg=event.data;
    if(msg[0]==='data') {
        if(v3_data===undefined) {
            v3_data=[];
        }
        v3_data.push(msg[1]['v1'][0]);
        if(v3_data.length>60*30)
            v3_data.shift();
        v1_data = msg[1]['v1'][0];
        v2_data = msg[1]['v2'];
        if(is_first===true){
            drawV1();
            drawV3();
            drawV2();
            is_first=false;
        }else {
            drawV1();
            updateV3();
            drawV2();
        }
    }

    if(msg[0]==='sensorInfo') {
        processSensorInfo(msg);
    }
}

function getSVGElementCenter(box) {
    return [box.width/2 + box.x, box.height/2 + box.y];
}

// (function updateVisualization() {
//     web_worker.postMessage(['updateData']);
//     web_worker.postMessage(['sensorInfo']);
// })();

window.addEventListener("DOMContentLoaded", function() {
    initV2();
    initV1();
    initV3();
    W = window.innerWidth;
    H = window.innerHeight;
    initInteraction();
    startWebWorker();
    // web_worker.postMessage(['updateData']);
    web_worker.postMessage(['sensorInfo']);
    update();
});



function update() {
    web_worker.postMessage(['updateData']);
    setTimeout(update, 4000);
}