var streamgraph_width,streamgraph_height,streamgraph_svg,stream_xscale,stream_yscale,stream_x_axis_svg,stream_y_axis,streamAxisX;

var sensorFrom=1;
var sensorTo=100;
var sensorsToShow=d3.range(sensorFrom, sensorTo);
var sdata;
var colorrange = [];

var colors=d3.scaleLinear()
		.domain([0,197])
		.range(['#fdbb84','#e34a33']);

var trans = d3.transition()
    .duration(750)
    .ease(d3.easeLinear);

for(var i=0; i<198; i++){
  colorrange.push(colors(i));
}
var sliderFrom = d3.sliderHorizontal()
	.min(1).max(197)
	.tickFormat(d3.format(',d')).ticks(25)
	.step(1)
	.default(sensorFrom)
	.on('end', val => {
	  sensorFrom=val;
	  updateStreamGraph(sdata);
	});
var sliderTo = d3.sliderHorizontal()
	.min(1).max(197)
	.tickFormat(d3.format(',d')).ticks(25)
	.step(1)
	.default(sensorTo)
	.on('end', val => {
	  sensorTo=val;
	  updateStreamGraph(sdata);
	});
var group1 = d3.select("#sliderFrom").append("svg")
	.attr("height", 40)
	.attr("width","90%")
	.append("g");
var group2 = d3.select("#sliderTo").append("svg")
	.attr("height", 40)
	.attr("width","90%")
	.append("g");

var dates=[];

function initStreamGraph() {
	streamgraphInitialized=true;
	streamgraph_width=document.getElementById("streamgraph-svg").getBoundingClientRect().width;
	streamgraph_height=document.getElementById("streamgraph-svg").getBoundingClientRect().height;
	stream_xscale = d3.scaleLinear()
	    .range([0, streamgraph_width - 20])
	    .clamp(true);

	stream_yscale=d3.scaleLinear()
		.range([streamgraph_height,40]);
    streamAxisX=d3.axisTop(stream_xscale).ticks(30);
	streamgraph_svg=d3.select("#streamgraph-svg");


	// d3.select("#streamgraph-svg").append('g').attr("transform","translate(10,18)").attr("class","axis").call(barAxisX);
}

function updateStreamGraph(stream_data) {
	// group1.attr("width",streamgraph_width-40)
	// z = colorScale;
	startDate=new Date(d3.select('#time-from')._groups[0][0].value);
	d3.range(0,stream_data.length).forEach(function(idx) {
		startDate.setSeconds(startDate.getSeconds()+5);
		dates.push(new Date(startDate.getTime()));
	});
    stream_xscale.domain([0,stream_data.length])
	sdata=stream_data;
	sliderFrom.width(streamgraph_width/2-70);
	sliderTo.width(streamgraph_width/2-70);
	group1.call(sliderFrom);
	group2.call(sliderTo);

    stack = d3.stack()
    	.keys(d3.range(sensorFrom,sensorTo+1))
    	.order(d3['stackOrderDescending'])
        .offset(d3['stackOffsetSilhouette']);
    area = d3.area()
        .curve(d3.curveBasis)
        .x(function(d,i) { return stream_xscale(i); })
        .y0(function(d) { return stream_yscale(d[0]); })
        .y1(function(d) { return stream_yscale(d[1]); });
    data=stack(stream_data);

	stream_yscale.domain([
      d3.min(data, l => d3.min(l, d => d[0])),
      d3.max(data, l => d3.max(l, d => d[1]))
    ]);
	streampaths=streamgraph_svg.selectAll('path').data(data);
	streampaths.exit().remove();
    streampaths.transition(trans)
    	.attr('d',area)
    	.attr("fill", (d,i)=>colorrange[i]);


    streampaths.enter()
    	.append('path')
    	.attr("stroke","grey")
    	.attr("stroke-opacity","0.5")
    	.attr("stroke-width","0.4")
    	.attr('d',area)
    	.attr("fill", (d,i)=>colorrange[i])
    	.on("mouseover", function(d,i) {
    		d3.select(this).attr("stroke-opacity","1").attr("stroke-width","1");
    		return rectMouseover(this,[d.key,undefined,d[d.index].data[d.key-1]]);
    	})
    	.on("mouseout", function(d,i) {
    		d3.select(this).attr("stroke-opacity","0.5").attr("stroke-width","0.4");
    		return rectMouseout(this,[d.key]);
    	});

}
