var bargraph_width,bargraph_height,bargraph_svg,bar_xscale,bar_yscale,bar_x_axis_svg,bar_y_axis,barXScale,barAxisX;


function initBarGraph() {
	bargraphInitialized=true;
	bargraph_width=document.getElementById("bar-svg").getBoundingClientRect().width;
	bargraph_height=document.getElementById("bar-svg").getBoundingClientRect().height;
	bar_xscale = d3.scaleLinear()
	    .domain([0,197])
	    .range([0, bargraph_width - 20])
	    .clamp(true);

    barAxisX=d3.axisTop(bar_xscale).ticks(30);

	d3.select("#bar-svg").append("g").attr("class","bargroup");

	d3.select("#bar-svg").append("g").attr("transform","translate(10,18)").attr("class","axis").call(barAxisX);

}

function updateBarGraph(series_data) {

 //    stack = d3.stack()
 //    	.keys(d3.range(1,198));
	// x = d3.scaleBand()
	//     .domain(d3.range(1,198))
	//     .range([0, bargraph_width - 20])
	//     .padding(0.1);
	// y = d3.scaleLinear()
	//     .domain([0.0000000000005 ,0.00000005, 0.000009])
	//     .rangeRound([0, bargraph_height-10])

	// d3.select('.bargroup').selectAll('g')
	// 	.data(stack(series_data))
	// 	.enter().append("g")
	// 	  .attr("transform","translate(10,20)")
	// 	  .attr("fill", (d, i) => "steelblue")
	// 	.selectAll("rect")
	// 	.data(d => {debugger; return d})
	// 	.enter().append("rect")
	// 	  .attr("x", (d, i) => {return x(d.key)})
	// 	  .attr("y", d => y(d[1]))
	// 	  .attr("height", d => y(d[1]) - y(d[0]))
	// 	  .attr("width", x.bandwidth());


	var bar_hscale=function(d,i) {
		return d3.scaleLinear().domain([0.0000000000005 ,0.00000005, 0.000009]).range([0,10]).clamp(true)(d);
	}

	bars=d3.select('.bargroup').selectAll('g')
		.data(series_data);
		bars
		.enter().append("g")
		.attr("transform","translate(10,20)")
		.selectAll("rect")
		.data(d=>d).enter().append("rect")
			.attr("x",(d,i,g)=>{return bar_xscale(+d.x)+3})
			.attr("y",(d,i,g)=>{if(i===0) {return 0;} else {return d3.sum(series_data[+d.x].slice(0,i),dd=>bar_hscale(parseFloat(dd.y),d.x));}})
			.attr("width", 3)
			.attr("stroke",d=>colorScale(+d.y))
			.attr("stroke-width",0.3)
			.attr("stroke-opacity",0.5)
			.attr("fill",d=>colorScale(+d.y))
			.attr("height",d=>bar_hscale(parseFloat(d.y),+d.x))
			.on("mouseover", function(d,i) {
				return rectMouseover(this,[+d.x+1,i,d.y]);
			})
			.on("mouseout",function(d, i) {
				return rectMouseout(this,[+d.x+1,i,d.y]);
			});
		bars.exit().remove();
		bars.selectAll("rect")
			.attr("x",(d,i,g)=>{return bar_xscale(+d.x)+3})
			.attr("y",(d,i,g)=>{if(i===0) {return 0;} else {return d3.sum(series_data[+d.x].slice(0,i),dd=>bar_hscale(parseFloat(dd.y),d.x));}})
			.attr("width", 3)
			.attr("stroke",d=>colorScale(+d.y))
			.attr("stroke-width",0.3)
			.attr("stroke-opacity",0.5)
			.attr("fill",d=>colorScale(+d.y))
			.attr("height",d=>bar_hscale(parseFloat(d.y),+d.x));
}
