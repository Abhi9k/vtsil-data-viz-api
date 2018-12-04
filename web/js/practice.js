// const xScale = d3.scaleLinear()
// .domain([margin.left, margin.left + width])
// .range([0, width]);

// const yScale = d3.scaleLinear()
// .domain([margin.top, margin.top + height])
// .range([0, height]);

// draw a circle
// vis.append("circle")
// 	.attr("cx",width/2)
// 	.attr("cy",height/2)
// 	.attr("r",20);

// draw a circle without fill
// vis.append("circle")
// 	.attr("cx",width/2)
// 	.attr("cy",height/2)
// 	.attr("fill","white")
// 	.attr("r",20);
// draw a two overlappint circles with color
// vis.append("circle")
// 	.attr("cx",width/2-10)
// 	.attr("cy",height/2)
// 	.attr("fill","red")
// 	.attr("fill-opacity","0.5")
// 	.attr("r",20)
// 	.attr("stroke-opacity","0.5")
// 	.attr("stroke","black");
// vis.append("circle")
// 	.attr("cx",width/2+10)
// 	.attr("cy",height/2)
// 	.attr("fill","blue")
// 	.attr("fill-opacity","0.5")
// 	.attr("r",20)
// 	.attr("stroke-opacity","0.5")
// 	.attr("stroke","black");

// draw equidistant circles
// var x=d3.range(10,width,20);
// var y=d3.range(10,height,20);
// var data=d3.zip(x,y);
// vis.selectAll("circle")
// 	.data(data).enter()
// 	.append("circle")
// 	.attr("cx",d=>d[0])
// 	.attr("cy",d=>d[1])
// 	.attr("r",10)
// 	.attr("fill","steelblue")
// 	.attr("fill-opacity","0.6");

// draw a horizontal line with equally spaced small vertical lines
// vis.append("line")
// 	.attr("x1",0)
// 	.attr("y1",height/2)
// 	.attr("x2",width)
// 	.attr("y2",height/2)
// 	.attr("stroke","black")
// 	.attr("stroke-width",2)
// 	.attr("stroke-opacity","0.5");
// var x=d3.range(0,width,10);
// var y1=height/2-2;
// var y2=height/2+2;
// vis.selectAll("line")
// 	.data(x).enter().append("line")
// 		.attr("x1",d=>d)
// 		.attr("y1",y1)
// 		.attr("x2",d=>d)
// 		.attr("y2",y2)
// 		.attr("stroke","black")
// 		.attr("stroke-width",1);

// draw a polyline
// var x=[];
// d3.range(1,5).forEach(d=>x.push(d3.randomUniform(0,width)()));
// var y=[];
// d3.range(1,5).forEach(d=>y.push(d3.randomUniform(0,height)()));
// var data=d3.zip(x,y);
// var points=""
// data.forEach(function(d){points=points+" "+d[0]+","+d[1];});
// vis.append("polyline")
// 	.attr("stroke","black")
// 	.attr("stroke-opacity","0.7")
// 	.attr("points",points)
// 	.attr("fill","none");

// draw an octagon
// var points="0,50 10,40 24,40 34,50 34,60 24,70 10,70 0,60 0,50"
// vis.append("polyline")
// 	.attr("stroke","black")
// 	.attr("stroke-opacity","0.7")
// 	.attr("points", points)
// 	.attr("fill","none");

// draw a rectangle with rounded corner
// vis.append("rect")
// 	.attr("fill","none")
// 	.attr("x",10)
// 	.attr("y",10)
// 	.attr("width", 50)
// 	.attr("height",100)
// 	.attr("rx",20);

//draw a histogram
// var x=d3.range(0,width,30);
// var y=[];
// x.forEach(d=>y.push(d3.randomUniform(height/2+10,0)()));
// data=d3.zip(x,y);
// vis.selectAll("rect").data(data).enter().append("rect")
// 		.attr("x",d=>d[0])
// 		.attr("y",height/2)
// 		.attr("width",10)
// 		.attr("height",d=>(d[1]));

// draw a histogram with proper scale
// var x=d3.range(10,width,30);
// var y=[];
// var heightScale=d3.scaleLinear()
// 					.domain([0,10])
// 					.range([height/2,0]);
// var colorScale=d3.scaleLinear()
// 					.domain([0,height/4,height/2])
// 					.range(['black','grey','white']);
// x.forEach(d=>y.push(heightScale(d3.randomUniform(0,10)())));
// var data=d3.zip(x,y);
// vis.selectAll("rect").data(data).enter().append("rect")
// 		.attr("x",d=>d[0])
// 		.attr("y",d=>height/2-d[1])
// 		.attr("width",10)
// 		.attr("fill",d=>colorScale(d[1]))
// 		.attr("height",d=>d[1]);

// vis.append("line")
// 	.attr("x1",0)
// 	.attr("y1",height/2)
// 	.attr("x2",width)
// 	.attr("y2",height/2);
// var xAxis=d3.axisBottom(d3.scaleLinear().domain([0,width]).range([0,width])).ticks(5);
// var yAxis=d3.axisLeft(heightScale);
// vis.append("g").attr("transform","translate(0,"+height/2+")").call(xAxis);
// vis.append("g").call(yAxis);

// experiment mouseover and transition
// var x=d3.range(0,width,20);
// var y=d3.range(0,height,20);
// var z=20;
// var data=d3.cross(x,y);
// var colorScale=d3.scaleLinear()
// 					.domain([0,width])
// 					.range(["white","grey"]);
// vis.selectAll('rect').data(data).enter().append("rect")
// 		// .attr("x",d=>d[0])
// 		// .attr("y",d=>d[1])
// 		.attr("height",z)
// 		.attr("width",z)
// 		.attr("transform",translate)
// 		.attr("fill",d=>colorScale(d[0]))
// 		.on("mouseover",domagic);
// function translate(d){
// 	return "translate("+d[0]+","+d[1]+")";
// }
// function domagic(d) {
// 	// this.parentNode.appendChild(this);
// 	d3.select(this)
// 		.style("pointer-events","none")
// 		.transition()
// 			.duration(750)
// 			.attr("transform","translate(100,150)scale(10)")
// 		.transition()
// 			.delay(1500)
// 			.style("fill-opacity",0)
// 			.attr("transform","scale(0)")
// 			.remove()
// }