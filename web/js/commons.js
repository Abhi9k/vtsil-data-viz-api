; var Commons = (function(mod, DOCUMENT, WINDOW) {

     mod.sensor_coords = [[], [], [], [], []];
     mod.formatDate = function(d) {
          return d.getFullYear() + "-" + (d.getMonth()+1).toString().padStart(2, '0') + "-" + d.getDate().toString().padStart(2, '0') + "T" + d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0') + ":" + d.getSeconds().toString().padStart(2, '0') +"Z";
     }

    mod.currDate = function() {
        var d = new Date();
        d.setMinutes(0);
        d.setSeconds(0);
        d.setDate(1);
        return mod.formatDate(d);
    }

	mod.processSensorInfo = function(msg) {
	    var sensor_info = msg[1];
	    var sids = Object.keys(sensor_info);
	    var sid_floor_mapping = {};
	    for(var i=0; i<sids.length; i++){
              var sid = sids[i];
              var floor = sensor_info[sid]['floor'];
              var x = parseFloat(sensor_info[sid]['x']);
              var y = parseFloat(sensor_info[sid]['y']);
              var z = parseFloat(sensor_info[sid]['z']);
	         sid_floor_mapping[sid] = floor;
              mod.sensor_coords[+floor - 1].push([+sid, floor, x, y, z]);
	    }
	    mod.sensor_info = sensor_info;
	    mod.sids = sids;
	    mod.sid_floor_mapping = sid_floor_mapping;
	};

    mod.getDaqNamesForFloor = function(floor) {
        var sids = Object.keys(mod.sensor_info);
        var response = [];
        for(var i=0; i<sids.length; i++) {
            if(mod.sensor_info[sids[i]]['floor'] === floor)
                response.push(mod.sensor_info[sids[i]]['daq_name']);
        }
        return response;
    }

	mod.getSVGElementCenter = function(box) {
    	return [box.width/2 + box.x, box.height/2 + box.y];
	}

     mod.calculateTooltipPosition = function(mx, my, screen_w, screen_h) {
          var pos=[0,0];
          pos[0]=(screen_w-mx<300?(mx-300):mx)
          pos[1]=(screen_h-my<200?(my-200):my);
          return pos;
     };

	mod.MIN_POWER = 0.0000000000000000000009;
	mod.MAX_POWER = 0.0009;
	mod.floormap_outer = [
	 [['0', '0'], ['11.14', '0']],
     [['11.14', '0'], ['11.14', '3.79']],
     [['11.14', '3.79'], ['17.33', '3.79']],
     [['17.33', '3.79'], ['43.16', '3.59']],
     [['43.16', '3.59'], ['49.57', '3.59']],
     [['49.57', '3.59'], ['49.57', '32.09']],
     [['49.57', '32.09'], ['34.27', '32.21']],
     [['34.27', '32.21'], ['34.27', '36.13']],
     [['34.27', '36.13'], ['11.14', '36.13']],
     [['11.14', '36.13'], ['11.14', '38.22']],
     [['11.14', '38.22'], ['-27.58', '38.22']],
     [['-27.58', '38.22'], ['-26.23', '-26.1']],
     [['-26.23', '-26.1'], ['-13.19', '-26.1']],
     [['-13.19', '-26.1'], ['-13.19', '-19.85']],
     [['-13.19', '-19.85'], ['-0.15', '-19.85']],
     [['-0.15', '-19.85'], ['0', '0']],
     [['0', '0'], ['11.14', '0']],
     [['11.14', '0'], ['11.14', '3.79']],
     [['11.14', '3.79'], ['17.33', '3.79']],
     [['17.33', '3.79'], ['43.16', '3.59']],
     [['43.16', '3.59'], ['49.57', '3.59']],
     [['49.57', '3.59'], ['49.57', '32.21']],
     [['49.57', '32.21'], ['34.27', '32.21']],
     [['34.27', '32.21'], ['34.27', '36.13']],
     [['34.27', '36.13'], ['11.14', '36.13']],
     [['11.14', '36.13'], ['11.14', '38.22']],
     [['11.14', '38.22'], ['-27.58', '38.22']],
     [['-27.58', '38.22'], ['-26.23', '-26.1']],
     [['-26.23', '-26.1'], ['-13.19', '-26.1']],
     [['-13.19', '-26.1'], ['-13.19', '-19.85']],
     [['-13.19', '-19.85'], ['-0.15', '-19.85']],
     [['-0.15', '-19.85'], ['0', '0']],
     [['0', '0'], ['11.14', '0']]];
    mod.floormap_inner = [
     [['17.158', '11.973'], ['36.364', '11.867']],
     [['36.364', '11.867'], ['36.364', '25.379']],
     [['36.364', '25.379'], ['-3.791', '25.379']],
     [['-3.791', '25.379'], ['-14.126', '25.44']],
     [['-14.126', '25.44'], ['-14.126', '31.979']],
     [['-14.126', '31.979'], ['-22.379', '31.979']],
     [['-22.379', '31.979'], ['-22.379', '16']],
     [['-22.379', '16'], ['-2.6105', '13.9865']],  
     [['-2.6105', '13.9865'], ['17.158', '11.973']],
     [['17.158', '11.973'], ['36.364', '11.867']]];

    mod.startWebWorker = function() {
	    if(typeof(Worker) !== "undefined") {
	        if(typeof(mod.web_worker) == "undefined") {
	            mod.web_worker = new Worker("js/webWorker.js");
	        }
	    } else {}
	};

	mod.getDimensions = function(id) {
	    var width = DOCUMENT.getElementById(id).getBoundingClientRect().width;
	    var height = DOCUMENT.getElementById(id).getBoundingClientRect().height;
	    var y = DOCUMENT.getElementById(id).getBoundingClientRect().y;
	    var x = DOCUMENT.getElementById(id).getBoundingClientRect().x;
	    return [width, height, x, y];
	};

	mod.updateScreenDimensions = function(h, w) {
		mod.H = h;
		mod.W = w;
	}


	return mod;

})(Commons || {}, document, window);

Commons.startWebWorker();
