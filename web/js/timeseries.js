var timeseriesXScale,timeseriesYScale,timeseriesSvg,svgWidth,svgHeight,timeseriesXAxis,timeseriesYAxis,line;
var parseTime;
var margin=80;
var p = Math.max(0, d3.precisionRound(0.0000000000001, 1.0000000000001) - 1),
    f = d3.format("." + p + "e");

// var f=d3.formatPrefix(",.0", 1e-12);
function parseDate(d) {
	d=new Date(d);
	utcHours=d.getUTCHours();
	d.setHours(utcHours-5);
	return d;
}

var trans = d3.transition()
    .duration(750)
    .ease(d3.easeLinear);

function initTimeseries() {
	svgWidth=document.getElementById("times-series-svg").getBoundingClientRect().width;
	svgHeight=document.getElementById("times-series-svg").getBoundingClientRect().height;

	timeseriesXScale = d3.scaleTime()
    	.range([margin, svgWidth - margin]);
	timeseriesYScale = d3.scaleLinear()
	    .range([svgHeight - margin, margin]);


	line = d3.line()
	    .x(d => timeseriesXScale(parseDate(d.x)))
	    .y(d => f(timeseriesYScale(+d.y)))
	    .curve(d3.curveMonotoneX);

	timeseriesSvg=d3.select("#times-series-svg");
	timeseriesSvgPath=timeseriesSvg.append("path");

  timeseriesXAxis=timeseriesSvg.append("g")
      .attr("transform", "translate(0,"+(svgHeight-margin)+")")

  timeseriesYAxis=timeseriesSvg.append("g")
  			.attr("transform", `translate(${margin},0)`);

}

function updateTimeseries(timeseriesData) {

  timeseriesXScale.domain(d3.extent(timeseriesData, d => parseDate(d.x)));
  timeseriesYScale.domain([d3.min(timeseriesData, d => +d.y), d3.max(timeseriesData, d => +d.y)]).nice();
  timeseriesXAxis.call(d3.axisBottom(timeseriesXScale).ticks(svgWidth / 80).tickSizeOuter(0));
  timeseriesYAxis.call(d3.axisLeft(timeseriesYScale));
  timeseriesSvgPath.transition(trans)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line(timeseriesData));

  
}