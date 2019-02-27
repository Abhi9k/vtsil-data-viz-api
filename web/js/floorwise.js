var per_floor = {}, floorwise_pause=true, idx=0, floorwise_data, sids, dates, sensor_info, floor_num=1, power_values;
var progressBar;
per_floor['floor'] = {
	padding: {l:30,b:30,t:30,r:30},
	h:0,
	w:0,
	y:0,
	x:0,
	svg:null
}
per_floor['psd'] = {
	padding: {l:60,b:40,t:15,r:15},
	h:0,
	w:0,
	y:0,
	x:0,
	svg:null
}

per_floor['playback'] = {
	padding: {l:30,b:30,t:30,r:30},
	h:0,
	w:0,
	y:0,
	x:0,
	svg:null
}

function getPowerValue(sid, idx) {
	if(floorwise_data === undefined)
		return MIN_POWER;
	if(sid in floorwise_data)
		return floorwise_data[+sid][idx][1];
	else
		return MIN_POWER;
}

function getTimestampValue(idx) {
	if(floorwise_data === undefined)
		return "";
	return floorwise_data[sids[0]][idx][0];

}

function startFloorwiseStreaming(data) {
	floorwise_data = data;
	idx = 0;
	sids = Object.keys(data);
	power_values = [];
	for(var i=0; i<sids.length; i++) {
		floorwise_data[sids[i]].map(d=>power_values.push(d[1]));
	}
	power_values = power_values.sort((a,b)=>(a-b))
    dates = data[sids[0]].map(x=>[x[0]])
    drawPlayback(dates);
	function stream() {
		if(floorwise_pause===false)
			return;
		idx += 1;
		drawSensors(floormap_outer, sensor_coords[+floor_num-1]);
		moveTracker(idx)
		if(idx<dates.length)
			setTimeout(stream, 4000);
	}
	stream();

}

function onWebWorkerMessage(event) {
	var msg = event.data;
    if(msg[0]==='sensorInfo') {
        processSensorInfo(msg);
    }
}

function togglePlay() {
	floorwise_pause=!floorwise_pause;
	d3.select('#floorwise-pause').classed('hidden', floorwise_pause);
	d3.select('#floorwise-play').classed('hidden', !floorwise_pause);
}

d3.select('#floorwise-play')
	.on('click', togglePlay);
d3.select('#floorwise-pause')
	.on('click', togglePlay);



function initFloorwiseView() {
	per_floor.floor.svg = d3.select('#floor').append('svg')
				.attr('width', "100%")
				.attr('height', '100%')
				.attr('stroke', 'white');

	per_floor.psd.svg = d3.select('#floor-sensor-psd').append('svg')
				.attr('width', "100%")
				.attr('height', '100%')
				.attr('stroke', 'white');

	per_floor.playback.svg = d3.select('#playback-svg').append('svg')
				.attr('width', "100%")
				.attr('height', '100%')
				.attr('stroke', 'white');

	let dimensions = getDimensions("floor");
	
	per_floor.floor.w = Math.floor(dimensions[0]);
	per_floor.floor.h = per_floor.floor.w*0.9;
    per_floor.floor.x = Math.floor(dimensions[2]);
    per_floor.floor.y = Math.floor(dimensions[3]);

	dimensions = getDimensions("floor-sensor-psd");
	per_floor.psd.w = Math.floor(dimensions[0]);
	per_floor.psd.h = per_floor.floor.h;
    per_floor.psd.x = Math.floor(dimensions[2]);
    per_floor.psd.y = Math.floor(dimensions[3]);

    dimensions = getDimensions("playback-svg");
   	per_floor.playback.w = Math.floor(dimensions[0]);
	per_floor.playback.h = Math.floor(dimensions[1]);
    per_floor.playback.x = Math.floor(dimensions[2]);
    per_floor.playback.y = Math.floor(dimensions[3]);

    per_floor.playback.svg.append('g').attr('class', 'track');
    per_floor.playback.svg.append('g').attr('class', 'tracker').append('circle');
    
    per_floor.psd.svg.append('g').attr('class', 'paths');
    per_floor.psd.svg.append('g').attr('class', 'axis x');
    per_floor.psd.svg.append('g').attr('class', 'axis y');
    per_floor.psd.svg.append('g').attr('class', 'axis-label label-y').append('text');
    per_floor.psd.svg.append('g').attr('class', 'axis-label label-x').append('text');
    per_floor.psd.svg.append('g').attr('class', 'title').append('text');

    per_floor.floor.svg.append('g').attr('class', 'paths');
    per_floor.floor.svg.append('g').attr('class', 'circles');
    per_floor.floor.svg.append('g').attr('class', 'title').append('text');

	drawFloor(floormap_outer, floormap_inner);
	// drawSensors(floormap_outer, sensor_coords[+floor_num-1]);
}

function drawFloor(floor_plan_outer, floor_plan_inner) {
	var settings = per_floor.floor;
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
}

function drawPlayback(data) {
	var settings = per_floor.playback;
	var x_scale = d3.scaleTime()
						.domain(d3.extent(data, d=>new Date(d[0])))
						.range([settings.padding.l, settings.w-settings.padding.r]);
	var line = d3.line()
					.x(d=>x_scale(new Date(d[0])))
					.y(d=>10);

	var playback = settings.svg.select('g.track')
						.selectAll('path')
						.data([data]);
	playback
		.enter()
		.append('path')
		.merge(playback)
			.attr('d', line)
			.attr('stroke-width', 6)
			.attr('stroke', 'white')
			.attr('fill', 'white');

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
				position=calculateTooltipPosition(position[0],position[1],W,H);
				d3.select('#tooltip')
					.style('left', (position[0]+10)+"px")
					.style('top', (position[1]+10)+"px");
				d3.select('#playback-time').text(dates[idx]);

			})
			.on('mouseout', function() {
				d3.select('#tooltip').classed('hidden', true);
			});
}

function moveTracker(idx) {
	var date = dates[idx];
	var settings = per_floor.playback;
	var x_scale = d3.scaleTime()
						.domain(d3.extent(dates, d=>new Date(d[0])))
						.range([settings.padding.l, settings.w-settings.padding.r]);
	settings.svg.select('g.tracker').select('circle')
			.transition()
			.attr('cx', x_scale(new Date(date)));
}

function onSensorSelection(sid) {
	console.log(sid+ " selected");
	var api = "http://128.173.25.223/api/psd/"+sid+"?d="+dates[idx];

	d3.json(api).then(function(response) {
		if(response['msg']==='error') {
			d3.select('.alert').classed('hidden', false);
			return;
		}
		else
			d3.select('.alert').classed('hidden', true);
    	d3.select('.loader').classed('hidden', true);
    	drawPSD({id:sid, data:response.data});

    });
}

function floorSelected() {
    var floor_select = document.getElementById('select-floor-number');
    var selected = floor_select.options[floor_select.selectedIndex];
    var floor_selected = selected.value;
    floor_num = floor_selected;
    onFetchButtonClicked();
}

function drawSensors(floor_plan_outer, sensor_locations) {
	var settings = per_floor.floor;
	var circles = settings.svg.select('g.circles').selectAll('circle').data(sensor_locations, d=>d[0]);
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
			.merge(circles)
				.attr('cx', d=>x_scale(d[2]))
				.attr('cy', d=>y_scale(d[3]))
				.attr('r', d=>radius_scale(getPowerValue(d[0], idx)))
				.attr('fill', d3.rgb(253, 133, 58));
	circles.exit().remove();

}

function drawPSD(data) {
	var settings = per_floor.psd;
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
				.attr('fill', 'none');
	psdlines.exit().remove();

	var x_axis = d3.axisBottom(x_scale);
	var p = Math.max(0, d3.precisionRound(0.0, 1.0) - 1)
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
			.text('Average Power');

	settings.svg.select('g.label-x').select('text')
			.attr('transform','translate('+(settings.w/2)+","+(settings.h-10)+")")
			.attr('text-anchor', 'middle')
			.text('Frequency');

	settings.svg.select('g.title').select('text')
			.attr('transform','translate('+(3*settings.w/4)+","+(settings.padding.t)+")")
	        .attr("text-anchor", "middle")  
	        .style("font-size", "16px")
			.attr('stroke', 'white')
			.text(dates[idx]);

}

window.addEventListener("DOMContentLoaded", function() {
    W = window.innerWidth;
    H = window.innerHeight;
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
    initFloorwiseView();
    startWebWorker();
    web_worker.postMessage(['sensorInfo']);
});
