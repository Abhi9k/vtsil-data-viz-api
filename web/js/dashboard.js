; var Dashboard = (function(mod, Commons, DashboardInteraction, DashboardFloorViz, DashboardSpectrumViz, DashboardTimeseriesViz, DOCUMENT, WINDOW) {
	var is_first = true;
	Commons.web_worker.onmessage = function(event) {
	    var msg=event.data;
	    if(msg[0]==='data') {
	    	DashboardTimeseriesViz.initData(msg[1]['v1'][0]);
	    	DashboardFloorViz.initData(msg[1]['v1'][0]);
	    	DashboardSpectrumViz.initData(msg[1]['v2'])
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
			Commons.web_worker.postMessage(['updateData']);
	    WINDOW.setTimeout(mod.update, 4000);
	}

	return mod;

})(Dashboard || {}, Commons, DashboardInteraction, DashboardFloorViz, DashboardSpectrumViz, DashboardTimeseriesViz, document, window);

window.addEventListener("DOMContentLoaded", function() {
    DashboardFloorViz.initView();
    DashboardSpectrumViz.initView();
    DashboardTimeseriesViz.initView();
    Commons.updateScreenDimensions(window.innerHeight, window.innerWidth);
    DashboardInteraction.init(Commons.W, Commons.H);
    Commons.web_worker.postMessage(['sensorInfo']);
    Dashboard.update();
});