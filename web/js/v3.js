var v3 = {
	padding: {l:40,b:40,t:5,r:40},
	h:0,
	w:0,
	y:0,
	x:0,
	svg:null
}

function initV3() {
	v3.svg = d3.select('#v3').append('svg')
				.attr('width', "100%")
				.attr('height', '100%')
				.attr('stroke', 'white');
	let dimensions = getDimensions("v3");
	v3.w = Math.floor(dimensions[0]);
	v3.h = Math.floor(dimensions[1]);
    v3.x = Math.floor(dimensions[2]);
    v3.y = Math.floor(dimensions[3]);
    var zoom_view = d3.select('#v3-parent').select('.zoom-view')
						.style('top', (v3.y+v3.padding.t)+"px")
						.style('left', (v3.x+v3.w-v3.padding.r)+"px");

	zoom_view.select('.zoom-in')
					.on('click', function() {
						zoomInView('v3', 'v2');
					});

	zoom_view.select('.zoom-out')
					.on('click', function() {
							resetZoom();
						});

	v3.svg.append('g').attr('class', 'paths');
	v3.svg.append('g').attr('class', 'axis x');
	v3.svg.append('g').attr('class', 'axis y');
	v3.svg.append('g').attr('class', 'axis-label').append('text');
}

var area,x_inverse_scale,x_inverse_scale_index,stack,x_scale,y_scale,color_scale,color,x_axis,y_axis,p;

function drawV3() {
	stack = d3.stack()
					.keys(d3.range(1,198))
					.value((d,key)=>d['value'][key])
					.order(d3.stackOrderDescending);

	var s_data = stack(v3_data);

	var y_min = d3.min(s_data.flat(), d=>d[1]);
	var y_max = d3.max(s_data.flat(), d=>d[1]);

	x_scale = d3.scaleTime()
					.domain([new Date(v3_data[0].ts), new Date(v3_data[v3_data.length-1].ts)])
					.range([v3.padding.l, v3.w-v3.padding.r]);

	x_inverse_scale = d3.scaleLinear()
							.range([new Date(v3_data[0].ts), new Date(v3_data[v3_data.length-1].ts)])
							.domain([v3.padding.l, v3.w-v3.padding.r]);

    x_inverse_scale_index = d3.scaleTime()
								.domain([new Date(v3_data[0].ts), new Date(v3_data[v3_data.length-1].ts)])
								.range([0,v3_data.length-1]);

	y_scale = d3.scaleLinear()
					.domain([y_min, y_max])
					.range([v3.h-v3.padding.b,v3.padding.t]);
    
    color_scale = d3.scaleLinear()
    					.domain([0,196])
    					.range([0,1]);

    color = d3.scaleSequential(d3.interpolateSpectral);

	x_axis = d3.axisBottom(x_scale)
					.ticks(d3.timeMinute.every(1))
					.tickFormat(d3.timeFormat("%I:%M:%S"));

	p = Math.max(0, d3.precisionRound(0.0, 1.0) - 1)
	y_axis = d3.axisLeft(y_scale)
					.tickFormat(d3.format("." + p + "e"));

	area = d3.area()
				.x(d=>x_scale(new Date(d.data.ts)))
				.y0(d=>y_scale(d[0]))
				.y1(d=>y_scale(d[1]));

	v3.svg.select('g.paths')
			.selectAll('path')
			.data(s_data)
			.enter()
			.append('path')
				.attr('class', d=>"sensor"+d.key)
				.attr('fill', (d,i)=>color(color_scale(i)))
				.attr('stroke', 'none')
		        .on("mouseover", function(d, i) {
		        	d.id = d.key;
		        	var curr_val=d[Math.round(x_inverse_scale_index(x_inverse_scale(d3.event.x)))];
	                var tooltip_data = [
	                    "Sensor ID: "+d.id,
	                    {
	                        "key": "Power",
	                        "value": (curr_val[1]-curr_val[0]).toExponential(2)
	                    }
	                    ,
	                    {
	                    	"key": "Timestamp",
	                    	"value": curr_val.data.ts
	                    }
	                ];
	                var position = [
	                    d3.event.x,
	                    d3.event.y
	                ];
	                updateTooltip(tooltip_data, position);
		            return commonMouseover(this, d, 'v3');
		        })
		        .on("mouseout", function(d) {
		        	d.id = d.key;
		            return commonMouseout(this, d, 'v3');
		        })
		        .on("hovered", function(d) {
		        	v3.svg.select('g.paths').selectAll('path').attr('opacity', 0.5);
		            sid=d3.event.detail.id;
		            if(+sid===+d.key) {
		            	// var center = this.getPointAtLength(this.getTotalLength()/4);
		            	d3.select(this)
		            		.attr('stroke', 'black')
		            		.attr('stroke-width', 1)
		            		.attr('opacity', 1);
		            }
		        })
		        .on("unhovered", function(d) {
		        	v3.svg.select('g.paths').selectAll('path').attr('opacity', 1);
		            sid=d3.event.detail.id;
	                if(+sid===+d.key) {
		            	d3.select(this)
		            		.attr('stroke', 'none')
		            		.attr('stroke-width', 0);
	                }
		        })
	            .on("click", function(d, i) {
	                addToSelection(d.id);
	                selectedAnimation(d3.event.x,d3.event.y);
	            })
				.attr('d', area);

	v3.svg.select('g.x')
			.attr('transform', 'translate(0,'+(v3.h-v3.padding.b)+')')
		.call(x_axis)
		.call(g => g.select(".domain").remove());

	v3.svg.select('g.y')
			.attr('transform', 'translate('+(v3.padding.l)+',0)')
		.call(y_axis)
		.call(g=>g.select('.domain').remove());

	v3.svg.select('g.axis-label').select('text')
			.attr('transform','translate('+(v3.w/2)+","+(v3.h-10)+")")
			.attr('text-anchor', 'middle')
			.attr('stroke', 'white')
			.text('Time');

}

function updateV3() {
	var s_data = stack(v3_data);
	var y_min = d3.min(s_data.flat(), d=>d[1]);
	var y_max = d3.max(s_data.flat(), d=>d[1]);
    color = d3.scaleSequential(d3.interpolateSpectral);	
	x_scale = d3.scaleTime()
						.domain([new Date(v3_data[0].ts), new Date(v3_data[v3_data.length-1].ts)])
						.range([v3.padding.l, v3.w-v3.padding.r]);

	x_inverse_scale = d3.scaleLinear()
							.range([new Date(v3_data[0].ts), new Date(v3_data[v3_data.length-1].ts)])
							.domain([v3.padding.l, v3.w-v3.padding.r]);

    x_inverse_scale_index = d3.scaleTime()
								.domain([new Date(v3_data[0].ts), new Date(v3_data[v3_data.length-1].ts)])
								.range([0,v3_data.length-1]);
	y_scale = d3.scaleLinear()
					.domain([y_min, y_max])
					.range([v3.h-v3.padding.b,v3.padding.t]);
	color_scale = d3.scaleLinear()
	    					.domain([0,196])
	    					.range([0,1]);
	x_axis = d3.axisBottom(x_scale)
					.ticks(d3.timeMinute.every(1))
					.tickFormat(d3.timeFormat("%I:%M:%S"));

	p = Math.max(0, d3.precisionRound(0.0, 1.0) - 1)
	y_axis = d3.axisLeft(y_scale)
					.tickFormat(d3.format("." + p + "e"));

	v3.svg.select('g.paths')
			.selectAll('path')
			.data(s_data)
				.transition()
				.duration(500)
				.attr('fill', (d,i)=>color(color_scale(i)))
				.attr('d', area);
	v3.svg.select('g.x')
			.call(x_axis)
			.call(g=>g.select('.domain').remove());
	v3.svg.select('g.y')
			.call(y_axis)
			.call(g=>g.select('.domain').remove());

}