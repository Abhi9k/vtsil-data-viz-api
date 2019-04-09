; var DashboardTimeseriesViz = (function(mod, Commons, DashboardInteraction, WINDOW, DOCUMENT){

	var padding = {l:60,b:40,t:5,r:60},
			h=0, w=0, x=0, y=0, svg,
			view_id = 'v3', viz_data = {},
			area, x_inverse_scale, x_inverse_scale_index, stack, x_scale, line,
			y_scale, color_scale, color, x_axis, y_axis, p, min_ts, max_ts, min_v=1000, max_v=0;


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
							DashboardInteraction.zoomInView(view_id, 'v2', mod);
						});

		zoom_view.select('.zoom-out')
						.on('click', function() {
							DashboardInteraction.resetZoom();
						});

		svg.append('g').attr('class', 'paths');
		svg.append('g').attr('class', 'axis x');
		svg.append('g').attr('class', 'axis y');
		svg.append('g').attr('class', 'axis-label').append('text');
	};

	mod.initData = function(data) {
		viz_data = data;
	}


	mod.updateData = function(data) {
		var keys = Object.keys(data.value);
		if((min_ts === undefined) || (new Date(data.ts) < min_ts))
			min_ts = new Date(data.ts);
		if((max_ts === undefined) || (new Date(data.ts) > max_ts))
			max_ts = new Date(data.ts);

		keys.forEach(function(key) {
			if(viz_data[key] === undefined)
				viz_data[key] = [];

			viz_data[key].push([data.ts, data.value[key]]);
			min_v = d3.min([min_v, data.value[key]]);
			max_v = d3.max([max_v, data.value[key]]);

			if(viz_data[key].length > 60*10*300)
				viz_data[key].shift();
		});
	};


	mod.draw = function() {
		p = Math.max(0, d3.precisionRound(0.0, 1.0) - 1);
		var keys = Object.keys(viz_data);


		// var keys = Object.keys(Commons.sid_floor_mapping);
		// var present_keys = Object.keys(viz_data[0].value);
		// var keys_filtered = keys.filter(k=>present_keys.includes(k));
		// keys_filtered = keys_filtered.map(x=>+x);
		// stack = d3.stack()
		// 				.keys(keys_filtered)
		// 				.value((d, key)=>d['value'][key])
		// 				.order(d3.stackOrderDescending);

		// var s_data = stack(viz_data);

		// var y_min = d3.min(s_data.flat(), d=>d[0]);
		// var y_max = d3.max(s_data.flat(), d=>d[1]);

		// var length = viz_data.length;

		// x_scale = d3.scaleTime()
		// 				.domain([new Date(viz_data[0].ts), new Date(viz_data[length-1].ts)])
		// 				.range([padding.l, w - padding.r]);

		// x_inverse_scale = d3.scaleLinear()
		// 						.range([new Date(viz_data[0].ts), new Date(viz_data[length-1].ts)])
		// 						.domain([padding.l, w - padding.r]);

	 //    x_inverse_scale_index = d3.scaleTime()
		// 							.domain([new Date(viz_data[0].ts), new Date(viz_data[length-1].ts)])
		// 							.range([0, length-1]);

		// y_scale = d3.scaleLinear()
		// 				.domain([y_min, y_max])
		// 				.range([h - padding.b, padding.t]);
	    
	 //    color_scale = d3.scaleLinear()
	 //    					.domain([0, Object.keys(keys.length)])
	 //    					.range([0, 1]);

	 //    color = d3.scaleSequential(d3.interpolateSpectral);

		// x_axis = d3.axisBottom(x_scale)
		// 				.ticks(d3.timeMinute.every(1))
		// 				.tickFormat(d3.timeFormat("%B %d, %Y %I:%M:%S"));

		
		// y_axis = d3.axisLeft(y_scale)
		// 				.tickFormat(d3.format("." + p + "e"));

		// area = d3.area()
		// 			.x(d=>x_scale(new Date(d.data.ts)))
		// 			.y0(d=>y_scale(d[0]))
		// 			.y1(d=>y_scale(d[1]));

		// svg.select('g.paths')
		// 		.selectAll('path')
		// 		.data(s_data)
		// 		.enter()
		// 		.append('path')
		// 			.attr('class', d=>"sensor"+d.key)
		// 			.attr('fill', (d,i)=>color(color_scale(i)))
		// 			.attr('stroke', 'none')
		// 	        .on("mouseover", function(d, i) {
		// 	        	d.id = d.key;
		// 	        	var curr_val=d[Math.round(x_inverse_scale_index(x_inverse_scale(d3.event.x)))];
		//                 var tooltip_data = [
		//                     "Sensor: "+Commons.sensor_info[d.id]['daq_name'],
		//                     {
		//                         "key": "Power",
		//                         "value": (curr_val[1]-curr_val[0]).toExponential(2)
		//                     }
		//                     ,
		//                     {
		//                     	"key": "Timestamp",
		//                     	"value": curr_val.data.ts
		//                     }
		//                 ];
		//                 var position = [
		//                     d3.event.x,
		//                     d3.event.y
		//                 ];
		//                 DashboardInteraction.updateTooltip(tooltip_data, position);
		// 	            return DashboardInteraction.commonMouseover(this, d, view_id);
		// 	        })
		// 	        .on("mouseout", function(d) {
		// 	        	d.id = d.key;
		// 	            return DashboardInteraction.commonMouseout(this, d, view_id);
		// 	        })
		// 	        .on("hovered", function(d) {
		// 	        	svg.select('g.paths').selectAll('path').attr('opacity', 0.5);
		// 	            var sid=d3.event.detail.id;
		// 	            if(+sid===+d.key) {
		// 	            	d3.select(this)
		// 	            		.attr('stroke', 'black')
		// 	            		.attr('stroke-width', 1)
		// 	            		.attr('opacity', 1);
		// 	            }
		// 	        })
		// 	        .on("unhovered", function(d) {
		// 	        	svg.select('g.paths').selectAll('path').attr('opacity', 1);
		// 	            var sid=d3.event.detail.id;
		//                 if(+sid===+d.key) {
		// 	            	d3.select(this)
		// 	            		.attr('stroke', 'none')
		// 	            		.attr('stroke-width', 0);
		//                 }
		// 	        })
		//             .on("click", function(d, i) {
		//                 DashboardInteraction.addToSelection(d.id);
		//                 DashboardInteraction.selectedAnimation(d3.event.x, d3.event.y);
		//             })
		// 			.attr('d', area);

		// svg.select('g.x')
		// 		.attr('transform', 'translate(0,'+(h - padding.b)+')')
		// 	.call(x_axis)
		// 	.call(g => g.select(".domain").remove());

		// svg.select('g.y')
		// 		.attr('transform', 'translate('+(padding.l)+','+(0)+')')
		// 	.call(y_axis)
		// 	.call(g=>g.select('.domain').remove());

		// svg.select('g.axis-label').select('text')
		// 		.attr('transform','translate('+(w/2)+","+(h - padding.b/2 + padding.t+5)+")")
		// 		.attr('text-anchor', 'middle')
		// 		.attr('stroke', 'white')
		// 		.text('Time');




		x_scale = d3.scaleTime()
						.domain([min_ts, max_ts])
						.range([padding.l, w - padding.r]);

		y_scale = d3.scaleLinear()
						.domain([min_v, max_v])
						.range([h - padding.b, padding.t]);

		x_inverse_scale = d3.scaleLinear()
								.range([min_ts, max_ts])
								.domain([padding.l, w - padding.r]);

		y_inverse_scale = d3.scaleLinear()
								.domain([h - padding.b, padding.t])
								.range([max_v, min_v]);

	    x_inverse_scale_index = d3.scaleTime()
									.domain([min_ts, max_ts])
									.range([0, length-1]);

		x_axis = d3.axisBottom(x_scale)
						.ticks(d3.timeMinute.every(1))
						.tickFormat(d3.timeFormat("%I:%M:%S"));

		y_axis = d3.axisLeft(y_scale)
						.tickFormat(d3.format("." + p + "e"));

		color_scale = d3.scaleLinear()
	    					.domain([0, keys.length])
	    					.range([0, 1]);

	    color = d3.scaleSequential(d3.interpolateSpectral);

	    line = d3.line().x(d=>x_scale(new Date(d[0]))).y(d=>y_scale(d[1]));

	    svg.select('g.paths').selectAll('g')
	    	.data(keys, d=>d)
	    	.enter()
	    	.append('g')
	    		.attr('class', d=>"sensor"+d)
	        .on("mouseover", function(d, i) {
	        	d = {'id': d};
	        	var curr_val = x_inverse_scale(d3.event.x);
                var position = [
                    d3.event.x,
                    d3.event.y
                ];
                var tooltip_data = [
                    "Sensor: "+Commons.sensor_info[d.id]['daq_name'],
                    {
                        "key": "Power",
                        "value": (y_inverse_scale(position[1])).toExponential(2)
                    }
                    ,
                    {
                    	"key": "Timestamp",
                    	"value": d3.timeFormat("%I:%M:%S")(x_inverse_scale(position[1]))
                    }
                ];
                DashboardInteraction.updateTooltip(tooltip_data, position);
	            return DashboardInteraction.commonMouseover(this, d, view_id);
	        })
	        .on("mouseout", function(d) {
	        	d = {'id': d};
	            return DashboardInteraction.commonMouseout(this, d, view_id);
	        })
	        .on("hovered", function(d) {
	        	svg.select('g.paths').selectAll('path').attr('opacity', 0.1);
	            var sid=d3.event.detail.id;
	            if(+sid===+d) {
	            	d3.select(this).select('path')
	            		.attr('opacity', 1);
	            }
	        })
	        .on("unhovered", function(d) {
	        	svg.select('g.paths').selectAll('path')
	        			.attr('opacity', 1);
	        })
            .on("click", function(d, i) {
                DashboardInteraction.addToSelection(d);
                DashboardInteraction.selectedAnimation(d3.event.x, d3.event.y);
            });

	    keys.forEach(function(key) {
	    	var circle_data = [viz_data[key][0][0], viz_data[key][0][1], key];
	    	var circles = svg.select('g.sensor'+key)
	    			.selectAll('circle')
	    			.data([circle_data], d=>d[2]);
	    	circles
	    		.enter()
	    			.append('circle')
	    				.attr('r', 5)
	    				.attr('fill', 'none')
	    			.on('mouseover', function(d) {
			        	svg.select('g.paths').selectAll('path')
			        			.attr('opacity', 0.5);
			            var sid = d[2];
			            if(+sid===+d) {
			            	d3.select(this).select('path')
			            		.attr('opacity', 1);
			            }
	    			})
	    			.on('mouseout', function(d) {
			        	svg.select('g.paths').selectAll('path')
			        			.attr('opacity', 1);
			    	})
	    			.merge(circles)
	    				.attr('cx', d=>x_scale(new Date(d[0])))
	    				.attr('cy', d=>y_scale(d[1]));

	    	var paths = svg.select('g.sensor'+key)
				    		.selectAll('path')
				    		.data([viz_data[key]]);
			paths
	    		.enter()
	    		.append('path')
	    			.attr('stroke', function(d, i){return color(color_scale(+this.parentElement.__data__));})
	    			.attr('fill', 'none')
	    			.attr('stroke-width', 2)
	    		.merge(paths)
	    			.attr('d', line);

	    });

		svg.select('g.x')
				.attr('transform', 'translate(0,'+(h - padding.b)+')')
			.call(x_axis)
			.call(g => g.select(".domain").remove());

		svg.select('g.y')
				.attr('transform', 'translate('+(padding.l)+','+(0)+')')
			.call(y_axis)
			.call(g=>g.select('.domain').remove());

		svg.select('g.axis-label').select('text')
				.attr('transform','translate('+(w/2)+","+(h - padding.b/2 + padding.t+5)+")")
				.attr('text-anchor', 'middle')
				.attr('stroke', 'white')
				.text('Time');


	};

	// mod.update = function() {
	// 	var s_data = stack(viz_data);
	// 	var y_min = d3.min(s_data.flat(), d=>d[0]);
	// 	var y_max = d3.max(s_data.flat(), d=>d[1]);

	// 	var length = viz_data.length;

	// 	x_scale = d3.scaleTime()
	// 						.domain([new Date(viz_data[0].ts), new Date(viz_data[length-1].ts)])
	// 						.range([padding.l, w - padding.r]);

	// 	x_inverse_scale = d3.scaleLinear()
	// 							.range([new Date(viz_data[0].ts), new Date(viz_data[length-1].ts)])
	// 							.domain([padding.l, w - padding.r]);

	//     x_inverse_scale_index = d3.scaleTime()
	// 								.domain([new Date(viz_data[0].ts), new Date(viz_data[length-1].ts)])
	// 								.range([0, length-1]);
	// 	y_scale = d3.scaleLinear()
	// 					.domain([y_min, y_max])
	// 					.range([h - padding.b, padding.t]);
	// 	color_scale = d3.scaleLinear()
	// 	    					.domain([0, Object.keys(Commons.sid_floor_mapping).length])
	// 	    					.range([0, 1]);
	// 	area = d3.area()
	// 				.x(d=>x_scale(new Date(d.data.ts)))
	// 				.y0(d=>y_scale(d[0]))
	// 				.y1(d=>y_scale(d[1]));

	// 	x_axis = d3.axisBottom(x_scale)
	// 					.ticks(d3.timeMinute.every(0.5))
	// 					.tickFormat(d3.timeFormat("%I:%M:%S"));

	// 	y_axis = d3.axisLeft(y_scale)
	// 					.tickFormat(d3.format("." + p + "e"));

	// 	svg.select('g.paths')
	// 			.selectAll('path')
	// 			.data(s_data)
	// 				.attr('fill', (d,i)=>color(color_scale(i)))
	// 				.attr('d', area);
	// 	svg.select('g.x')
	// 			.call(x_axis)
	// 			.call(g=>g.select('.domain').remove());
	// 	svg.select('g.y')
	// 			.call(y_axis)
	// 			.call(g=>g.select('.domain').remove());




	// 	var keys = Object.keys(viz_data);
	// 	x_scale = d3.scaleTime()
	// 					.domain([min_ts, max_ts])
	// 					.range([padding.l, w - padding.r]);

	// 	y_scale = d3.scaleLog()
	// 					.domain([min_v, max_v])
	// 					.range([h - padding.b, padding.t]);

	// 	x_axis = d3.axisBottom(x_scale)
	// 					.ticks(d3.timeMinute.every(1))
	// 					.tickFormat(d3.timeFormat("%I:%M:%S"));

	// 	y_axis = d3.axisLeft(y_scale)
	// 					.tickFormat(d3.format("." + p + "e"));

	// 	color_scale = d3.scaleLinear()
	//     					.domain([0, keys.length])
	//     					.range([0, 1]);

	//     svg.select('g.paths').selectAll('g')
	//     	.data(keys, d=>d)
	//     	.enter()
	//     	.append('g')
	//     		.attr('class', d=>"sensor"+d);

	//     keys.forEach(function(key) {
	//     	svg.select('g.sensor'+key)
	//     		.selectAll('path')
	//     		.data([viz_data[key]], function(d, i) {return this.__data__;})
	//     		.attr('d', line)
	//     		.attr('stroke', (d, i)=>color(color_scale(i)))
	//     		.attr('fill', 'none');
	//     });


	// };

	return mod;
})(DashboardTimeseriesViz || {}, Commons, DashboardInteraction, window, document);
