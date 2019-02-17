var v2 = {
	padding: {l:40,b:25,t:5,r:40},
	h:0,
	w:0,
	y:0,
	x:0,
	svg: null,
	v2_xaxis_g: null,
	v2_yaxis_g: null
}

function initV2() {
	v2.svg = d3.select('#v2').append('svg')
				.attr('width', "100%")
				.attr('height', '100%')
				.attr('stroke', 'white');
	let dimensions = getDimensions("v2");
	v2.w = Math.floor(dimensions[0]);
	v2.h = Math.floor(dimensions[1]);
    v2.x = Math.floor(dimensions[2]);
    v2.y = Math.floor(dimensions[3]);
    var zoom_view = d3.select('#v2-parent').select('.zoom-view')
						.style('top', (v2.y+v2.padding.t)+"px")
						.style('left', (v2.x+v2.w-v2.padding.r)+"px");
	zoom_view.select('.zoom-in')
					.on('click', function() {
						zoomInView('v2', 'v3');
					});
	zoom_view.select('.zoom-out')
					.on('click', function() {
							resetZoom();
						});
	v2.svg.append('g').attr('class', 'bars');
	v2.svg.append('g').attr('class', 'axis x');
	v2.svg.append('g').attr('class', 'axis y');
	v2.svg.append('g').attr('class', 'axis-label label-x').append('text');
	v2.svg.append('g').attr('class', 'axis-label label-y').append('text');

}

function drawV2() {
	var sensor_ids=f1_sensors.concat(f2_sensors,f3_sensors,f4_sensors,f5_sensors);
	v2_data_flat=v2_data.map(d=>d.data).flat();
	var x_scale = d3.scaleBand()
						.domain(sensor_ids)
						.range([v2.padding.l, v2.w-v2.padding.r])
						.paddingInner(0.05)
						.align(0);

	var y_scale = d3.scaleLinear()
						.domain(d3.extent(d3.range(v2_data[0].data.length)))
						.range([v2.h-v2.padding.b,v2.padding.t]);

	var color_scale = d3.scaleLinear()
						.domain([d3.min(v2_data_flat,d=>d.p), d3.max(v2_data_flat,d=>d.p)])
						.range([0,1]);

	var color = d3.scaleSequential(d3.interpolateYlOrRd);

	var sensors = v2.svg.select('g.bars')
					.selectAll('g')
					.data(v2_data);

	var sensor_rects = sensors
						.enter()
						.append('g')
							.attr('class', d=>"sensor"+d.id)
					        .on("mouseover", function(d,i) {
					            return commonMouseover(this, d, 'v2');
					        })
					        .on("mouseout", function(d) {
					            return commonMouseout(this, d, 'v2');
					        })
					        .on("hovered", function(d) {
					            sid=d3.event.detail.id;
					            if(+sid===+d.id) {
					            	var center = getSVGElementCenter(this.getBBox());
					            	d3.select('.v2.highlight')
					            		.classed('hidden', false)
					            		.style('top', v2.y+"px")
					            		.style('left', (x_scale(d.id))+"px")
					            		.style('width', x_scale.bandwidth()+"px")
					            		.style('height', (v2_data[0].data.length*(y_scale(0)-y_scale(1)))+"px");
					            }
					        })
					        .on("unhovered", function(d) {
					        	sid=d3.event.detail.id;
					        	if(+sid===+d.id) {
						            d3.select('.v2.highlight')
						            		.classed('hidden', true);
					            }
					        })
				            .on("click", function(d, i) {
				                addToSelection(+d.id);
				                selectedAnimation(d3.event.x,d3.event.y);
				            })
						.merge(sensors)
							.selectAll('rect')
							.data(d=>d.data);
	sensor_rects
			.enter()
			.append('rect')
				.attr('x', function(d,i) {id=this.parentNode.__data__.id;return x_scale(id);})
				.attr('y', (d,i)=>y_scale(i))
				.attr('width', x_scale.bandwidth())
				.attr('height', y_scale(0)-y_scale(1)-0.05)
				.attr('stroke', 'none')
				.on('mouseover', function(d, i) {
	                var tooltip_data = [
	                    "Sensor ID: "+this.parentNode.__data__.id,
	                    {
	                        "key": "Power",
	                        "value": d.p.toExponential(2)
	                    },
	                    {
	                    	"key": "Frequency",
	                    	"value": i
	                    }
	                ];
	                var position = [
	                    d3.event.x,
	                    d3.event.y
	                ];
	                updateTooltip(tooltip_data, position);
				})
			.merge(sensor_rects)
				.attr('fill', function(d,i) {return color(color_scale(d.p));});

	// var x_axis = d3.axisBottom(x_scale).tickValues(x_scale.domain().filter(function(d,i) {return !(i%5)}));
	var x_axis = d3.axisBottom(x_scale).tickValues(
		[f1_sensors.slice().reverse()[0],
		 f2_sensors.slice().reverse()[0],
		 f3_sensors.slice().reverse()[0],
		 f4_sensors.slice().reverse()[0],
		 f5_sensors.slice().reverse()[0]]);
	var y_axis = d3.axisLeft(y_scale).ticks(10);

	v2.svg.select('g.x')
			.attr('transform', 'translate(0,'+(v2.h-v2.padding.b+(y_scale(0)-y_scale(1)-0.05))+')')
			.call(x_axis)
			.call(g => g.select(".domain").remove());
	v2.svg.select('g.y')
			.attr('transform', 'translate('+(v2.padding.l)+','+(y_scale(0)-y_scale(1)-0.05)+')')
			.call(y_axis)
			.call(g => g.select(".domain").remove());

	v2.svg.select('g.label-x').select('text')
			.attr("transform", "rotate(-90)")
		    .attr("y", 2)
		    .attr("x", 0-(v2.h/2))
		    .attr("dy", "1em")
			.attr('text-anchor', 'middle')
			.text('Frequency');

	v2.svg.select('g.label-y').select('text')
			.attr('transform','translate('+(v2.w/2)+","+(v2.h-10)+")")
			.attr('text-anchor', 'middle')
			.text('Sensor ID');
}