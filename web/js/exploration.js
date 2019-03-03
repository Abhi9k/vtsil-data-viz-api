var exploration = {};
// exploration['raw'] = {
// 	padding: {l:40,b:40,t:15,r:15},
// 	h:0,
// 	w:0,
// 	y:0,
// 	x:0,
// 	svg:null
// }
exploration['psd'] = {
	padding: {l:80,b:40,t:15,r:80},
	h:0,
	w:0,
	y:0,
	x:0,
	svg:null
}

function onWebWorkerMessage(event) {

}

function initExploration() {
	// exploration.raw.svg = d3.select('#raw').append('svg')
	// 			.attr('width', "100%")
	// 			.attr('height', '100%')
	// 			.attr('stroke', 'white');

	exploration.psd.svg = d3.select('#psd').append('svg')
				.attr('width', "100%")
				.attr('height', '100%')
				.attr('stroke', 'white');

	// let dimensions = getDimensions("raw");
	// exploration.raw.w = Math.floor(dimensions[0]);
	// exploration.raw.h = Math.floor(dimensions[1]);
 //    exploration.raw.x = Math.floor(dimensions[2]);
 //    exploration.raw.y = Math.floor(dimensions[3]);

	dimensions = getDimensions("psd");
	exploration.psd.w = Math.floor(dimensions[0]);
	exploration.psd.h = Math.floor(dimensions[1]);
    exploration.psd.x = Math.floor(dimensions[2]);
    exploration.psd.y = Math.floor(dimensions[3]);
    
    exploration.psd.svg.append('g').attr('class', 'paths');
    exploration.psd.svg.append('g').attr('class', 'axis x');
    exploration.psd.svg.append('g').attr('class', 'axis y');
    exploration.psd.svg.append('g').attr('class', 'axis-label x').append('text');
    exploration.psd.svg.append('g').attr('class', 'axis-label y').append('text');
    exploration.psd.svg.append('g').attr('class', 'title').append('text');

    // exploration.raw.svg.append('g').attr('class', 'paths');
    // exploration.raw.svg.append('g').attr('class', 'axis x');
    // exploration.raw.svg.append('g').attr('class', 'axis y');
    // exploration.raw.svg.append('g').attr('class', 'axis-label').append('text');
    // exploration.raw.svg.append('g').attr('class', 'title').append('text');

}

function drawExplorationHelper(data, settings, title) {
    var xScale=d3.scaleTime()
        .domain(d3.extent(data,function(d){return new Date(d[0]);}))
        .range([settings.padding.l,settings.w-settings.padding.r]);
	this.xScaleInverse=d3.scaleLinear()
        .range(d3.extent(data,function(d){return new Date(d[0]);}))
        .domain([settings.padding.l,settings.w-settings.padding.r]);
    var yScale=d3.scaleLinear()
        .domain(d3.extent(data,function(d){return d[1];}))
        .range([settings.h-settings.padding.b,settings.padding.t]);
    var p = Math.max(0, d3.precisionRound(0.0, 1.0) - 1);
    var xAxis=d3.axisBottom(xScale)
    			.tickFormat(d3.timeFormat("%m-%d-%y %I:%M"));
    var yAxis=d3.axisLeft(yScale)
    			.tickFormat(d3.format("." + p + "e"));

    var line=d3.line().x(d=>xScale(new Date(d[0]))).y(d=>yScale(d[1]));

	settings.svg.select('.paths')
            .selectAll('path')
	        .data([data]).enter()
	        .append('path')
	        .merge(settings.svg.select('.paths').selectAll('path'))
	        	.attr('d',line)
	        	.attr("stroke", d3.rgb(33, 150, 243))
	        	.attr("stroke-width", 2)
	        	.attr('fill', 'none')
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
                    d3.select('#explore-time').text(xScaleInverse(position[0]));

                })
                .on('mouseout', function() {
                    d3.select('#tooltip').classed('hidden', true);
                });

	settings.svg.select('g.x')
          .attr("transform","translate(0,"+yScale.range()[0]+")")
        .call(xAxis)
        .call(g=>g.select('.domain').remove());
  	settings.svg.select("g.y")
  			.attr("transform","translate("+settings.padding.l+",0)")
        .call(yAxis)
        .call(g=>g.select('.domain').remove());

    settings.svg.select('g.axis-label.y').select('text')
            .attr("transform", "rotate(-90)")
            .attr("y", 10)
            .attr("x", 0-(settings.h/2))
            .attr("dy", "1em")
            .attr('text-anchor', 'middle')
            .text('Total Power');

    settings.svg.select('g.axis-label.x').select('text')
			.attr('transform','translate('+(settings.w/2)+","+(settings.h-5)+")")
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
	// drawExplorationHelper(exploration_data['raw'], exploration.raw, "Raw Sensor Values");
	drawExplorationHelper(exploration_data['psd'], exploration.psd, "Total Power vs Time");
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
    startWebWorker();
    initExploration();
});
