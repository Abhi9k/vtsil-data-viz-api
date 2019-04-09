; var Dashboard = (function(mod, Commons, DashboardInteraction, DashboardFloorViz, DashboardSpectrumViz, DashboardTimeseriesViz, DOCUMENT, WINDOW) {
	var is_first = true;
	Commons.web_worker.onmessage = function(event) {
	    var msg=event.data;
	    if(msg[0]==='data') {
	    	DashboardTimeseriesViz.updateData(msg[1]['v1'][0]);
	    	DashboardFloorViz.initData(msg[1]['v1'][0]);
	    	DashboardSpectrumViz.initData(msg[1]['v2']);
	        if(is_first===true){
	        	DashboardFloorViz.draw();
	        	DashboardSpectrumViz.draw();
	            DashboardTimeseriesViz.draw();
	            is_first=false;
	        }else {
	        	DashboardFloorViz.draw();
	        	DashboardSpectrumViz.draw();
	            // DashboardTimeseriesViz.update();
	            DashboardTimeseriesViz.draw();
	        }
	    }

	    if(msg[0]==='sensorInfo') {
	        Commons.processSensorInfo(msg);
	    }
	};


	mod.update = function() {
		if(!DashboardInteraction.is_hovered)
			Commons.web_worker.postMessage(['updateData', mod.start_time, 10]);
	    WINDOW.setTimeout(mod.update, 10000);
	}

	return mod;

})(Dashboard || {}, Commons, DashboardInteraction, DashboardFloorViz, DashboardSpectrumViz, DashboardTimeseriesViz, document, window);

d3.select('#start_stream')
	.on('click', function() {
		Dashboard.start_time = d3.select('#start_time')._groups[0][0].value;
    	DashboardTimeseriesViz.initData({});
    	DashboardFloorViz.initData([]);
    	DashboardSpectrumViz.initData([]);
    	window.clearTimeout();
    	Dashboard.update();
	});

function dashboardInit() {
    DashboardFloorViz.initView();
    DashboardSpectrumViz.initView();
    DashboardTimeseriesViz.initView();
    Commons.updateScreenDimensions(window.innerHeight, window.innerWidth);
    DashboardInteraction.init(Commons.W, Commons.H);
    Commons.web_worker.postMessage(['sensorInfo']);
    Dashboard.update();
}

window.addEventListener("DOMContentLoaded", function() {
    // DashboardFloorViz.initView();
    // DashboardSpectrumViz.initView();
    // DashboardTimeseriesViz.initView();
    // Commons.updateScreenDimensions(window.innerHeight, window.innerWidth);
    // DashboardInteraction.init(Commons.W, Commons.H);
    // Commons.web_worker.postMessage(['sensorInfo']);
    // Dashboard.update();
    dashboardInit();
});