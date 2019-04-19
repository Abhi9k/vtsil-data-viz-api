; var FloorwiseViz = (function(mod, Commons, DOCUMENT, WINDOW) {
	var floor={padding: {l:30,b:30,t:30,r:30}},
		psd={padding: {l:60,b:40,t:15,r:15}},
		playback={padding: {l:30,b:30,t:30,r:30}},
		viz_data = [],
		is_dragging=false, curr_idx, floor_num=1, sids, power_values, dates, is_paused,
		p = Math.max(0, d3.precisionRound(0.0, 1.0) - 1);

	function getPowerValue(sid, idx) {
		if(viz_data === undefined)
			return Commons.MIN_POWER;
		if(viz_data[+sid] && viz_data[+sid].length>0) {
			return viz_data[+sid][idx][1];
		}
		else
			return Commons.MIN_POWER;
	}

	function getTimestampValue(idx) {
		if(viz_data === undefined)
			return "";
		return viz_data[sids[0]][idx][0];

	}

	function stream() {
		if(is_dragging===true) {
			setTimeout(stream, 500);
			return;
		}
		curr_idx += 1;
		mod.drawSensors(Commons.floormap_outer, Commons.sensor_coords[+floor_num-1]);
		moveTracker(curr_idx)
		if(curr_idx < dates.length)
			setTimeout(stream, 500);
	}

	function startFloorwiseStreaming(data) {
		viz_data = data;
		curr_idx = 0;
		sids = Object.keys(viz_data);
		power_values = [];
		for(var i=0; i<sids.length; i++) {
			viz_data[sids[i]].map(d=>power_values.push(d[1]));
		}
		power_values = power_values.sort((a,b)=>(a-b))
	    dates = viz_data[sids[0]].map(x=>[x[0]])
	    mod.drawPlayback(dates);
		stream();

	}

	function togglePlay() {
		is_paused = !is_paused;
		d3.select('#floorwise-pause').classed('hidden', is_paused);
		d3.select('#floorwise-play').classed('hidden', !is_paused);
	}

	function moveTracker(idx) {
		var date = dates[idx];
		var settings = playback;
		var x_scale = d3.scaleTime()
							.domain(d3.extent(dates, d=>new Date(d[0])))
							.range([settings.padding.l, settings.w-settings.padding.r]);
		settings.svg.select('g.tracker').select('circle')
						.transition()
						.attr('cx', x_scale(new Date(date)));
	}

	function onSensorSelection(sid) {
		// console.log(sid+ " selected");
		var api = "http://128.173.25.223/api/psd/"+sid+"?d="+dates[curr_idx];

		d3.json(api).then(function(response) {
			if(response['msg']==='error') {
				d3.select('.alert').classed('hidden', false);
				return;
			}
			else
				d3.select('.alert').classed('hidden', true);
	    	d3.select('.loader').classed('hidden', true);
	    	mod.drawPSD({id: sid, data: response.data});

	    });
	}

	function fetchFloorPSD(floor_num, start_date, end_date) {
		var api = "http://128.173.25.223/api/floor/psd/"+(floor_num)+"?from="+start_date+"&to="+end_date;
		// var api = "http://localhost:8000/api/floor/psd/"+(floor_num)+"?from="+start_date+"&to="+end_date;

		d3.select('.loader').classed('hidden', false);

		d3.json(api).then(function(response) {
			if(response['msg']==='error') {
				d3.select('.alert').classed('hidden', false);
				return;
			}
			else
				d3.select('.alert').classed('hidden', true);
			startFloorwiseStreaming(response);
	    	d3.select('.loader').classed('hidden', true);
	    }).catch(function(error) {
	    	console.log(error);

			d3.select('.alert').classed('hidden', false);
			d3.select('.loader').classed('hidden', true);
	    });
	}

	mod.onFetchButtonClicked = function() {
	    var floor_select = document.getElementById('select-floor-number');
	    var selected = floor_select.options[floor_select.selectedIndex];
	    var floor_selected = selected.value;
	    var start_date = d3.select('#dtp_input_1').attr('value');
	    var end_date = d3.select('#dtp_input_2').attr('value');
	    if(start_date===undefined || start_date==="" || end_date===undefined || end_date==="")
	    	return
	    fetchFloorPSD(floor_selected, start_date, end_date);
	}

	mod.floorSelected = function() {
	    var floor_select = document.getElementById('select-floor-number');
	    var selected = floor_select.options[floor_select.selectedIndex];
	    var floor_selected = selected.value;
	    floor_num = floor_selected;
	    mod.onFetchButtonClicked();
	}

	mod.initView = function() {
		floor.svg = d3.select('#floor').append('svg')
						.attr('width', "100%")
						.attr('height', '100%')
						.attr('stroke', 'white');

		psd.svg = d3.select('#floor-sensor-psd').append('svg')
						.attr('width', "100%")
						.attr('height', '100%')
						.attr('stroke', 'white');

		playback.svg = d3.select('#playback-svg').append('svg')
						.attr('width', "100%")
						.attr('height', '100%')
						.attr('stroke', 'white');

		let dimensions = Commons.getDimensions("floor");
		
		floor.w = Math.floor(dimensions[0]);
		floor.h = floor.w*0.9;
	    floor.x = Math.floor(dimensions[2]);
	    floor.y = Math.floor(dimensions[3]);

		dimensions = Commons.getDimensions("floor-sensor-psd");
		psd.w = Math.floor(dimensions[0]);
		psd.h = floor.h;
	    psd.x = Math.floor(dimensions[2]);
	    psd.y = Math.floor(dimensions[3]);

	    dimensions = Commons.getDimensions("playback-svg");
	   	playback.w = Math.floor(dimensions[0]);
		playback.h = Math.floor(dimensions[1]);
	    playback.x = Math.floor(dimensions[2]);
	    playback.y = Math.floor(dimensions[3]);

	    playback.svg.append('g').attr('class', 'track');
	    playback.svg.append('g').attr('class', 'tracker').append('circle');
	    
	    psd.svg.append('g').attr('class', 'paths');
	    psd.svg.append('g').attr('class', 'axis x');
	    psd.svg.append('g').attr('class', 'axis y');
	    psd.svg.append('g').attr('class', 'axis-label label-y').append('text');
	    psd.svg.append('g').attr('class', 'axis-label label-x').append('text');
	    psd.svg.append('g').attr('class', 'title').append('text');

	    floor.svg.append('g').attr('class', 'paths');
	    floor.svg.append('g').attr('class', 'circles');
	    floor.svg.append('g').attr('class', 'title').append('text');

		mod.drawFloor(Commons.floormap_outer, Commons.floormap_inner);
	};

	mod.initData = function() {

	};

	mod.drawFloor = function(floor_plan_outer, floor_plan_inner) {
		var settings = floor;
	    var x_scale = d3.scaleLinear()
	                            .domain(d3.extent(floor_plan_outer.flat(), d=>parseFloat(d[0])))
	                            .range([settings.padding.l, settings.w-settings.padding.r]);
	    var y_scale = d3.scaleLinear()
	                            .domain(d3.extent(floor_plan_outer.flat(), d=>parseFloat(d[1])))
	                            .range([settings.h-settings.padding.b, settings.padding.t]);
	     var line = d3.line()
	     				.x(d=>x_scale(d[0]))
	     				.y(d=>y_scale(d[1]));

	    var inner = settings.svg.select('g.paths').selectAll('path').data(floor_plan_inner);
	    var outer = settings.svg.select('g.paths').selectAll('path').data(floor_plan_outer);

	    inner.enter()
	    		.append('path')
	    		.attr('d', line);
	    outer.enter()
	    		.append('path')
	    		.attr('d', line);
	};

	mod.drawSensors = function(floor_plan_outer, sensor_locations) {
		var settings = floor;
		var circles = settings.svg.select('g.circles')
							.selectAll('circle')
							.data(sensor_locations, d=>d[0]);
		var x_scale = d3.scaleLinear()
							.domain(d3.extent(floor_plan_outer.flat(), d=>parseFloat(d[0])))
							.range([settings.padding.l, settings.w-settings.padding.r]);
		var y_scale = d3.scaleLinear()
							.domain(d3.extent(floor_plan_outer.flat(), d=>parseFloat(d[1])))
							.range([settings.h-settings.padding.b, settings.padding.t]);

		var radius_scale = d3.scaleQuantile()
							.domain(power_values)
							.range(d3.range(0,20));

		var color = d3.scaleSequential(d3.interpolateYlOrRd);

		circles.enter()
				.append('circle')
					.attr('stroke', 'none')
					.on('click', d=>onSensorSelection(d[0]))
					.attr('opacity', 0.5)
					.attr('cx', d=>x_scale(d[2]))
					.attr('cy', d=>y_scale(d[3]))
					.on('mouseover', function(d) {
						d3.select('#tooltip').classed('hidden', false);
		                var position = [
		                    d3.event.x,
		                    d3.event.y
		                ];
						position=Commons.calculateTooltipPosition(position[0],position[1],Commons.W, Commons.H);
						d3.select('#tooltip')
							.style('left', (position[0]+10)+"px")
							.style('top', (position[1]+10)+"px");
						d3.select('#playback-time').text(
							Commons.sensor_info[+d[0]]['daq_name']+","+d3.format("." + p + "e")(getPowerValue(d[0], curr_idx)));

					})
					.on('mouseout', function() {
						d3.select('#tooltip').classed('hidden', true);
					})
				.merge(circles)
					.transition()
					.attr('r', d=>radius_scale(getPowerValue(d[0], curr_idx)))
					.attr('fill', d3.rgb(253, 133, 58));
		circles.exit().remove();
	}

	mod.drawPSD = function(data) {
		var settings = psd;
		var x_scale = d3.scaleLinear()
							.domain(d3.extent(data.data, d=>d[0]))
							.range([settings.padding.l, settings.w-settings.padding.r]);
		var y_scale = d3.scaleLinear()
							.domain(d3.extent(data.data, d=>d[1]))
							.range([settings.h-settings.padding.b, settings.padding.t]);

		var line = d3.line()
						.x(d=>x_scale(d[0]))
						.y(d=>y_scale(d[1]));
		var psdlines = settings.svg.select('g.paths').selectAll('path').data([data.data], d=>d[2]);
		psdlines.enter()
				.append('path')
					.attr('d', line)
					.attr('fill', 'none')
					.attr('stroke', d3.rgb(33, 150, 243));
		psdlines.exit().remove();

		var x_axis = d3.axisBottom(x_scale);
		var y_axis = d3.axisLeft(y_scale)
						.tickFormat(d3.format("." + p + "e"));

		settings.svg.select('g.x')
						.attr('transform', 'translate('+(0)+","+(settings.h-settings.padding.b)+')')
					.call(x_axis);
		settings.svg.select('g.y')
						.attr('transform', 'translate('+(settings.padding.l)+","+(0)+')')
					.call(y_axis);

		settings.svg.select('g.label-y').select('text')
				.attr("transform", "rotate(-90)")
			    .attr("y", 2)
			    .attr("x", 0-(settings.h/2))
			    .attr("dy", "1em")
				.attr('text-anchor', 'middle')
				.text('PSD');

		settings.svg.select('g.label-x').select('text')
				.attr('transform','translate('+(settings.w/2)+","+(settings.h-10)+")")
				.attr('text-anchor', 'middle')
				.text('Frequency');

		settings.svg.select('g.title').select('text')
				.attr('transform','translate('+(3*settings.w/4)+","+(settings.padding.t)+")")
		        .attr("text-anchor", "middle")  
		        .style("font-size", "16px")
				.attr('stroke', 'white')
				.text(dates[curr_idx]);
	};

	mod.drawPlayback = function(data) {
		var settings = playback;
		var x_scale = d3.scaleTime()
							.domain(d3.extent(data, d=>new Date(d[0])))
							.range([settings.padding.l, settings.w-settings.padding.r]);

		var index_scale = d3.scaleLinear()
								.domain([settings.padding.l, settings.w-settings.padding.r])
								.range([0, dates.length])
		var line = d3.line()
						.x(d=>x_scale(new Date(d[0])))
						.y(d=>10);

		var playback_svg = settings.svg.select('g.track')
							.selectAll('path')
							.data([data]);

		playback_svg
			.enter()
			.append('path')
			.merge(playback_svg)
				.attr('d', line)
				.attr('stroke-width', 6)
				.attr('stroke', 'white')
				.attr('fill', 'white')
				.on('mouseover', function() {
					d3.select('#tooltip').classed('hidden', false);
	                var position = [
	                    d3.event.x,
	                    d3.event.y
	                ];
					position=Commons.calculateTooltipPosition(position[0],position[1],Commons.W, Commons.H);

					var hoveredIdx = parseInt(index_scale(position[0]-settings.x-settings.padding.l));

					d3.select('#tooltip')
						.style('left', (position[0]+10)+"px")
						.style('top', (position[1]+10)+"px");
					d3.select('#playback-time').text(dates[hoveredIdx]);

				})
				.on('mouseout', function() {
					d3.select('#tooltip').classed('hidden', true);
				})
				.on('click', function() {
					var mouse_x = d3.event.x-settings.x-settings.padding.l;
					d3.select(this).attr("cx", x_scale(mouse_x));
					var prev_idx = curr_idx;
					curr_idx = parseInt(index_scale(mouse_x));
					if(prev_idx >= dates.length)
						stream();
				});

		settings.svg.select('g.tracker').select('circle')
				.attr('cx', settings.padding.l+5)
				.attr('cy', 10)
				.attr('r', 10)
				.attr('fill', d3.rgb(33, 150, 243))
				.attr('stroke', 'none')
				.on('mouseover', function() {
					d3.select('#tooltip').classed('hidden', false);
	                var position = [
	                    d3.event.x,
	                    d3.event.y
	                ];
					position=Commons.calculateTooltipPosition(position[0],position[1],Commons.W, Commons.H);
					d3.select('#tooltip')
						.style('left', (position[0]+10)+"px")
						.style('top', (position[1]+10)+"px");
					d3.select('#playback-time').text(dates[curr_idx]);

				})
				.on('mouseout', function() {
					d3.select('#tooltip').classed('hidden', true);
				});
	}

	mod.fetchDataAndDraw = function() {

	}

	return mod;

})(FloorwiseViz || {}, Commons, document, window);

d3.select('#explore-fetch')
    .on('click', function() {
    	FloorwiseViz.onFetchButtonClicked();
});


Commons.web_worker.onmessage = function(event) {
    var msg = event.data;
    if(msg[0]==='sensorInfo') {
        Commons.processSensorInfo(msg);
    }
};

window.addEventListener("DOMContentLoaded", function() {
    $('.form_datetime').datetimepicker({
        weekStart: 0,
        todayBtn:  0,
        autoclose: 1,
        todayHighlight: 0,
        startView: 2,
        forceParse: 1,
        showMeridian: 1
    });
    $('.to_datetime').datetimepicker({
        weekStart: 0,
        todayBtn:  0,
        autoclose: 1,
        todayHighlight: 0,
        startView: 2,
        forceParse: 1,
        showMeridian: 1
    });
    FloorwiseViz.initView();
    Commons.web_worker.postMessage(['sensorInfo']);
});
