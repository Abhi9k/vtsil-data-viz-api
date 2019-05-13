; var DashboardSpectrumViz = (function(mod, Commons, DashboardInteraction, WINDOW, DOCUMENT) {
	var padding = {l:60,b:25,t:5,r:60},
		h=0, w=0, x=0, y=0, svg,
		view_id = 'v2', viz_data = [];

	mod.initView = function() {
		svg = d3.select('#'+view_id).append('svg')
					.attr('width', "100%")
					.attr('height', '100%')
					.attr('stroke', 'white');
		var dimensions = Commons.getDimensions(view_id);
		w = Math.floor(dimensions[0]);
		h = Math.floor(dimensions[1]);
	    x = Math.floor(dimensions[2]);
	    y = Math.floor(dimensions[3]);
	    var zoom_view = d3.select('#'+view_id+'-parent').select('.zoom-view')
							.style('top', (y + padding.t)+"px")
							.style('left', (x + w - padding.r)+"px");
		zoom_view.select('.zoom-in')
						.on('click', function() {
							DashboardInteraction.zoomInView(view_id, 'v3', mod);
						});
		zoom_view.select('.zoom-out')
						.on('click', function() {
								DashboardInteraction.resetZoom();
							});
		svg.append('g').attr('class', 'bars');
		svg.append('g').attr('class', 'axis x');
		svg.append('g').attr('class', 'axis y');
		svg.append('g').attr('class', 'axis-label label-x').append('text');
		svg.append('g').attr('class', 'axis-label label-y').append('text');
	};


	mod.initData = function(data) {
		viz_data = data;
	};


	mod.draw = function() {
		var present_ids = viz_data.map(d=>d.id);
		var sensor_ids = [[], [], [], [], []];
		for(var i=0; i<present_ids.length; i++) {
			var floor_num = Commons.sid_floor_mapping[present_ids[i]];
			if(floor_num !== undefined)
				sensor_ids[+floor_num - 1].push(present_ids[i]);
		}

		var tickValues = [];
		for(var i=0; i<sensor_ids.length; i++) {
			tickValues.push(sensor_ids[i][sensor_ids[i].length - 1]);
		}


		var data_flat = viz_data.map(d=>d.data).flat();

		var x_scale = d3.scaleBand()
							.domain(sensor_ids.flat())
							.range([padding.l, w - padding.r])
							.paddingInner(0.05)
							.align(0);

		var y_scale = d3.scaleLinear()
							.domain(d3.extent(d3.range(viz_data[0].data.length)))
							.range([h - padding.b, padding.t]);

		var color_scale = d3.scaleLog()
							.domain([Commons.MIN_POWER, Commons.MAX_POWER])
							.range(d3.range(0, 2));

		var color = d3.scaleSequential(d3.interpolateYlOrRd);

		var sensors = svg.select('g.bars')
						.selectAll('g')
						.data(viz_data);

		var sensor_rects = sensors
							.enter()
							.append('g')
								.attr('class', d=>"sensor"+d.id)
						        .on("mouseover", function(d,i) {
						            return DashboardInteraction.commonMouseover(this, d, view_id);
						        })
						        .on("mouseout", function(d) {
						            return DashboardInteraction.commonMouseout(this, d, view_id);
						        })
						        .on("hovered", function(d) {
						            var sid=d3.event.detail.id;
						            if(+sid===+d.id) {
						            	d3.select('.v2.highlight')
						            		.classed('hidden', false)
						            		.style('top', y+"px")
						            		.style('left', x_scale(d.id)+"px")
						            		.style('width', x_scale.bandwidth()+"px")
						            		.style('height', (viz_data[0].data.length*(y_scale(0)-y_scale(1)))+"px");
						            }
						        })
						        .on("unhovered", function(d) {
						        	var sid=d3.event.detail.id;
						        	if(+sid===+d.id) {
							            d3.select('.v2.highlight')
							            		.classed('hidden', true);
						            }
						        })
					            .on("click", function(d, i) {
					                DashboardInteraction.moveToExploreViz(d);
					            })
							.merge(sensors)
								.selectAll('rect')
								.data(d=>d.data);
		sensor_rects
				.enter()
				.append('rect')
					.attr('x', function(d,i) {id=this.parentNode.__data__.id; return x_scale(id);})
					.attr('y', (d,i)=>y_scale(i))
					.attr('width', x_scale.bandwidth())
					.attr('height', y_scale(0)-y_scale(1)-0.05)
					.attr('stroke', 'none')
					.on('mouseover', function(d, i) {
		                var tooltip_data = [
		                    "Sensor: "+Commons.sensor_info[this.parentNode.__data__.id]['daq_name'],
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
		                DashboardInteraction.updateTooltip(tooltip_data, position);
					})
				.merge(sensor_rects)
					.attr('fill', function(d,i) {return color(color_scale(d.p));});

		var x_axis = d3.axisBottom(x_scale).tickValues(tickValues);
		var y_axis = d3.axisLeft(y_scale).ticks(10);

		svg.select('g.x')
				.attr('transform', 'translate(0,'+(h - padding.b+(y_scale(0)-y_scale(1)-0.05))+')')
				.call(x_axis)
				.call(g => g.select(".domain").remove());
		svg.select('g.y')
				.attr('transform', 'translate('+(padding.l)+','+(y_scale(0)-y_scale(1)-0.05)+')')
				.call(y_axis)
				.call(g => g.select(".domain").remove());

		svg.select('g.label-x').select('text')
				.attr("transform", "rotate(-90)")
			    .attr("y", 10)
			    .attr("x", 0-(h/2))
			    .attr("dy", "1em")
				.attr('text-anchor', 'middle')
				.text('Frequency');

		svg.select('g.label-y').select('text')
				.attr('transform','translate('+(w/2)+","+(h-5)+")")
				.attr('text-anchor', 'middle')
				.text('Sensor ID');
	};

	return mod;
})(DashboardSpectrumViz || {}, Commons, DashboardInteraction, window, document);

