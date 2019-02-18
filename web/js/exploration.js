var exploration = {};
exploration['raw'] = {
	padding: {l:40,b:40,t:15,r:15},
	h:0,
	w:0,
	y:0,
	x:0,
	svg:null
}
exploration['psd'] = {
	padding: {l:40,b:40,t:15,r:15},
	h:0,
	w:0,
	y:0,
	x:0,
	svg:null
}

function initExploration() {
	exploration.raw.svg = d3.select('#raw').append('svg')
				.attr('width', "100%")
				.attr('height', '100%')
				.attr('stroke', 'white');
	exploration.psd.svg = d3.select('#psd').append('svg')
				.attr('width', "100%")
				.attr('height', '100%')
				.attr('stroke', 'white');

	let dimensions = getDimensions("raw");
	exploration.raw.w = Math.floor(dimensions[0]);
	exploration.raw.h = Math.floor(dimensions[1]);
    exploration.raw.x = Math.floor(dimensions[2]);
    exploration.raw.y = Math.floor(dimensions[3]);

	dimensions = getDimensions("psd");
	exploration.psd.w = Math.floor(dimensions[0]);
	exploration.psd.h = Math.floor(dimensions[1]);
    exploration.psd.x = Math.floor(dimensions[2]);
    exploration.psd.y = Math.floor(dimensions[3]);
    
    exploration.psd.svg.append('g').attr('class', 'paths');
    exploration.psd.svg.append('g').attr('class', 'axis x');
    exploration.psd.svg.append('g').attr('class', 'axis y');
    exploration.psd.svg.append('g').attr('class', 'axis-label').append('text');
    exploration.psd.svg.append('g').attr('class', 'title').append('text');

    exploration.raw.svg.append('g').attr('class', 'paths');
    exploration.raw.svg.append('g').attr('class', 'axis x');
    exploration.raw.svg.append('g').attr('class', 'axis y');
    exploration.raw.svg.append('g').attr('class', 'axis-label').append('text');
    exploration.raw.svg.append('g').attr('class', 'title').append('text');

}

function drawExplorationHelper(data, settings, title) {
    var xScale=d3.scaleTime()
        .domain(d3.extent(data,function(d){return new Date(d[0]);}))
        .range([settings.padding.l,settings.w-settings.padding.r]);

    var yScale=d3.scaleLinear()
        .domain(d3.extent(data,function(d){return d[1];}))
        .range([settings.h-settings.padding.b,settings.padding.t]);
    var p = Math.max(0, d3.precisionRound(0.0, 1.0) - 1);
    var xAxis=d3.axisBottom(xScale)
    			.tickFormat(d3.timeFormat("%m-%d-%y %I:%M"));
    var yAxis=d3.axisLeft(yScale)
    			.tickFormat(d3.format("." + p + "e"));

    var line=d3.line().x(d=>xScale(new Date(d[0]))).y(d=>yScale(d[1]));

	settings.svg.selectAll('path')
	        .data([data]).enter()
	        .append('path')
	        	.attr('d',line)
	        	.attr("stroke",d3.rgb(33, 150, 243))
	        	.attr("stroke-width", 0.2)
	        	.attr('fill', 'none');

	settings.svg.select('g.x')
          .attr("transform","translate(0,"+yScale.range()[0]+")")
        .call(xAxis)
        .call(g=>g.select('.domain').remove());
  	settings.svg.select("g.y")
  			.attr("transform","translate("+settings.padding.l+",0)")
        .call(yAxis)
        .call(g=>g.select('.domain').remove());

    settings.svg.select('g.axis-label').select('text')
			.attr('transform','translate('+(settings.w/2)+","+(settings.h-10)+")")
			.attr('text-anchor', 'middle')
			.attr('stroke', 'white')
			.text('Time');

	settings.svg.select('.title').select('text')
			.attr('transform','translate('+(3*settings.w/4)+","+(settings.padding.t)+")")
	        .attr("text-anchor", "middle")  
	        .style("font-size", "16px")
	        .attr("stroke", "white")  
	        .text(title);
}
function drawExploration(exploration_data) {
	drawExplorationHelper(exploration_data['raw'], exploration.raw, "Raw Sensor Values");
	drawExplorationHelper(exploration_data['psd'], exploration.psd, "Average Power");
}