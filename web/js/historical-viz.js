; var HistoricalViz = (function(mod, Commons, DOCUMENT, WINDOW) {
	var padding = {l:80,b:40,t:15,r:80},
		h=0, w=0, x=0, y=0, svg,
		view_id = 'psd', viz_data = [],
		x_scale, y_scale, x_inverse_scale, p;

	mod.initView = function() {
		svg = d3.select('#'+view_id).append('svg')
					.attr('width', "100%")
					.attr('height', '100%')
					.attr('stroke', 'white');

		dimensions = Commons.getDimensions(view_id);
		w = Math.floor(dimensions[0]);
		h = Math.floor(dimensions[1]);
	    x = Math.floor(dimensions[2]);
	    y = Math.floor(dimensions[3]);
	    
	    svg.append('g').attr('class', 'paths');
	    svg.append('g').attr('class', 'axis x');
	    svg.append('g').attr('class', 'axis y');
	    svg.append('g').attr('class', 'axis-label x').append('text');
	    svg.append('g').attr('class', 'axis-label y').append('text');
	    svg.append('g').attr('class', 'title').append('text');
	};

	mod.fetchDataAndDraw = function(sensor, start_date, end_date) {
		var api = "http://128.173.25.223/api/explore/"+sensor+"?from="+start_date+"&to="+end_date;
		d3.select('.loader').classed('hidden', false);
		d3.json(api).then(function(response) {
			if(response['msg']==='error') {
				d3.select('.alert').classed('hidden', false);
				return;
			}
			else
				d3.select('.alert').classed('hidden', true);

	    	mod.initData(response['psd']);
	    	mod.draw();

	    	d3.select('.loader').classed('hidden', true);

	    }).catch(function(error) {
			d3.select('.alert').classed('hidden', false);
			d3.select('.loader').classed('hidden', true);
	    });
	};

	mod.draw = function() {
	    x_scale = d3.scaleTime()
			        .domain(d3.extent(viz_data, function(d){return new Date(d[0]);}))
			        .range([padding.l, w - padding.r]);

		x_inverse_scale = d3.scaleLinear()
					        .range(d3.extent(viz_data, function(d){return new Date(d[0]);}))
					        .domain([padding.l, w - padding.r]);

	    y_scale = d3.scaleLinear()
			        .domain(d3.extent(viz_data, function(d){return d[1];}))
			        .range([h - padding.b, padding.t]);

	   	p = Math.max(0, d3.precisionRound(0.0, 1.0) - 1);

	    var x_axis=d3.axisBottom(x_scale)
	    				.tickFormat(d3.timeFormat("%m-%d-%y %I:%M"));

	    var y_axis=d3.axisLeft(y_scale)
	    				.tickFormat(d3.format("." + p + "e"));

	    var line=d3.line().x(d=>x_scale(new Date(d[0]))).y(d=>y_scale(d[1]));

		svg.select('.paths')
	            .selectAll('path')
		        .data([viz_data]).enter()
		        .append('path')
		        .merge(svg.select('.paths').selectAll('path'))
		        	.attr('d', line)
		        	.attr("stroke", d3.rgb(33, 150, 243))
		        	.attr("stroke-width", 2)
		        	.attr('fill', 'none')
	                .on('mouseover', function() {
	                    d3.select('#tooltip').classed('hidden', false);
	                    var position = [
	                        d3.event.x,
	                        d3.event.y
	                    ];
	                    position = Commons.calculateTooltipPosition(
	                    	position[0], position[1], Commons.W, Commons.H);

	                    d3.select('#tooltip')
	                        .style('left', (position[0]+10)+"px")
	                        .style('top', (position[1]+10)+"px");

	                    d3.select('#explore-time').text(d3.timeFormat("%B %d, %Y %I:%M:%S")(x_inverse_scale(position[0])));

	                })
	                .on('mouseout', function() {
	                    d3.select('#tooltip').classed('hidden', true);
	                });

		svg.select('g.x')
	          .attr("transform","translate(0,"+y_scale.range()[0]+")")
	        .call(x_axis)
	        .call(g=>g.select('.domain').remove());

	    svg.select("g.y")
	  			.attr("transform","translate("+padding.l+",0)")
	        .call(y_axis)
	        .call(g=>g.select('.domain').remove());

	    svg.select('g.axis-label.y').select('text')
	            .attr("transform", "rotate(-90)")
	            .attr("y", 10)
	            .attr("x", 0-h/2)
	            .attr("dy", "1em")
	            .attr('text-anchor', 'middle')
	            .text('Total Power');

	    svg.select('g.axis-label.x').select('text')
				.attr('transform','translate('+(w/2)+","+(h-5)+")")
				.attr('text-anchor', 'middle')
				.attr('stroke', 'white')
				.text('Time');

		svg.select('.title').select('text')
				.attr('transform','translate('+(3*w/4)+","+(padding.t)+")")
		        .attr("text-anchor", "middle")  
		        .style("font-size", "16px")
		        .attr("stroke", "white")  
		        .text("Total Power vs Time");
	};

	mod.initData = function(data) {
		viz_data = data;
	};

	return mod;

})(HistoricalViz || {}, Commons, document, window);


d3.select('#explore-fetch')
    .on('click', function() {
        var sensor = d3.select('#sensor_name').property('value');
        var start_date = d3.select('#dtp_input_1').attr('value');
        var end_date = d3.select('#dtp_input_2').attr('value');
        HistoricalViz.fetchDataAndDraw(sensor, start_date, end_date);
    });

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

    HistoricalViz.initView();
});
