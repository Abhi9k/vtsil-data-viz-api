; var DashboardFloorViz = (function(mod, Commons, DashboardInteraction, WINDOW, DOCUMENT) {
	var padding = {l:40,b:20,t:20,r:40},
		h=0, w=0, x=0, y=0, svg_list,
		height_scale, x_scale, y_scale, color_scale, color, hs,
		mouseX, mouseY, mx, my,
		origin = [100, 170], beta = 0,
		cubesData = [[],[],[],[],[]], yLineInner=[[],[],[],[],[]],
		yLineOuter=[[],[],[],[],[]], alpha = 0,
		yStartAngle = -0.4166025040629945, xStartAngle=0.37562520858138826,
		building_color = d3.rgb(33, 150, 243), viz_data = []
		view_id = 'v1';


	function makeCube(h, x, z){
	    return [
	        {x: x - 3, y: h, z: z + 3}, // FRONT TOP LEFT
	        {x: x - 3, y: 0, z: z + 3}, // FRONT BOTTOM LEFT
	        {x: x + 3, y: 0, z: z + 3}, // FRONT BOTTOM RIGHT
	        {x: x + 3, y: h, z: z + 3}, // FRONT TOP RIGHT
	        {x: x - 3, y: h, z: z - 3}, // BACK  TOP LEFT
	        {x: x - 3, y: 0, z: z - 3}, // BACK  BOTTOM LEFT
	        {x: x + 3, y: 0, z: z - 3}, // BACK  BOTTOM RIGHT
	        {x: x + 3, y: h, z: z - 3}, // BACK  TOP RIGHT
	    ];
	};


	var cubes3D = d3._3d()
	    .shape('CUBE')
	    .x(function(d){ return d.x; })
	    .y(function(d){ return d.y; })
	    .z(function(d){ return d.z; })
	    .rotateY(yStartAngle)
	    .rotateX(xStartAngle);

	var yScale3dInner = d3._3d()
	    .shape('LINE_STRIP')
	    .rotateX(xStartAngle)
	    .rotateY(yStartAngle);

	var yScale3dOuter = d3._3d()
	    .shape('LINE_STRIP')
	    .rotateX(xStartAngle)
	    .rotateY(yStartAngle);


	function dragged() {
		var id = this.id;
	    mouseX = mouseX || 0;
	    mouseY = mouseY || 0;
	    beta   = (d3.event.x - mx + mouseX) * Math.PI / 230 ;
	    alpha  = (d3.event.y - my + mouseY) * Math.PI / 230  * (-1);

	    var data = [
	        yScale3dInner.rotateY(beta + yStartAngle)([yLineInner[id]]),
	        yScale3dOuter.rotateY(beta + yStartAngle)([yLineOuter[id]]),
	        cubes3D.rotateY(beta + yStartAngle)(cubesData[id])
	    ];
	    processData(id, data, 250);
	};

	function dragStart() {
	    mx = d3.event.x;
	    my = d3.event.y;
	};

	function dragEnd() {
	    mouseX = d3.event.x - mx + mouseX;
	    mouseY = d3.event.y - my + mouseY;
	};


	function addFloorSVG(selector, id) {
		return d3.select(selector).append('svg')
				.attr('width', "100%")
				.attr('height', "100%")
	            .attr('id', id)
			.call(
				d3.drag()
					.on('drag', dragged)
					.on('start', dragStart)
					.on('end', dragEnd))
			.append('g')
				.attr("stroke", "white");
	};


	function processData(id, data, tt){
		var svg = svg_list[id];
		var cubes = svg.selectAll('g.cube').data(data[2], function(d){ return d.id });
	    var yScaleInner = svg.selectAll('path.yScaleInner').data(data[0]);
	    var yScaleOuter = svg.selectAll('path.yScaleOuter').data(data[1]);

	    var faces = cubes
	        .enter()
	        .append('g')
	        	.attr('class', d=>'cube sensor'+d.id)
	            .attr('fill', building_color)
	            .attr('stroke', 'none')
	            .attr('stroke-width', 0.2)
	            .attr('opacity', 0.2)
		        .on("hovered", function(d, i) {
		            var sid = d3.event.detail.id;
	                d3.range(5).forEach(function(floor) {
	                    svg_list[floor].selectAll('g.cube')
	                        .attr('opacity', 0.2)
	                    });
		            if(+sid === d.id) {
	                     d3.select(this)
	                        .attr('opacity', 1)
	                        .attr('stroke', 'black')
	                        .attr('fill', 'red');
		            }
		        })
		        .on("unhovered", function(d,i) {
	                var sid=d3.event.detail.id;
	                d3.range(5).forEach(function(floor) {
	                    svg_list[floor].selectAll('g.cube')
	                        .attr('opacity', 0.2)
	                        .attr('stroke', 'none')
	                        .attr('fill', building_color);
	                    });
		        })
		        .on("mouseover", function(d, i) {
	                var tooltip_data = [
	                    "Sensor: "+Commons.sensor_info[d.id]['daq_name'],
	                    {
	                        "key": "Average Power",
	                        "value": viz_data.value[d.id].toExponential(2)
	                    }
	                ];
	                var position = [
	                    d3.event.x,
	                    d3.event.y
	                ];
	                DashboardInteraction.updateTooltip(tooltip_data, position);
		            return DashboardInteraction.commonMouseover(this, d, view_id);
		        })
		        .on("mouseout", function(d) {
		            return DashboardInteraction.commonMouseout(this, d, view_id);
		        })
	            .on("click", function(d, i) {
	                DashboardInteraction.addToSelection(d.id);
	                DashboardInteraction.selectedAnimation(d3.event.x,d3.event.y);
	            })
		    .merge(cubes)
	        .selectAll('path.face')
	        	.data(d=>d.faces, d=>d.face);

	     faces
	        .enter()
	        .append('path')
	        	.attr('class', 'face')
	        .merge(faces)
	        	.attr('d', function(d){return cubes3D.draw(d);});

	    yScaleInner
	        .enter()
	        .append('path')
	        	.attr('class', 'yScaleInner')
		        .attr('stroke-width', 0.75)
		        .attr('fill','none')
	        .merge(yScaleInner)
	        	.attr('d', yScale3dInner.draw);

	    if(id!=4)
	        yScaleOuter
	            .enter()
	            .append('path')
	    	        .attr('class', 'yScaleOuter')
	    	        .attr('stroke-width', 0.75)
	    	        .attr('fill','none')
	            .merge(yScaleOuter)
	            	.attr('d', yScale3dOuter.draw);
	};


	mod.initView = function() {
		svg_list = [];
		var dimensions = Commons.getDimensions(view_id);
		w = Math.floor(dimensions[0])/5;
		h = Math.floor(dimensions[1]);
	    x = Math.floor(dimensions[2]);
	    y = Math.floor(dimensions[3]);
		['.first','.second','.third','.fourth','.fifth'].forEach(
			(f,i)=>svg_list.push(addFloorSVG(f, i))
		);
	};


	mod.initData = function(data) {
		viz_data = data;
	}

	mod.draw = function() {

	    var data_values = Object.values(viz_data.value);


	    var data_values = data_values.sort((a,b)=>(a-b))

	    hs = d3.scaleQuantile()
	                            .domain(data_values)
	                            .range(d3.range(0, 6));

	    height_scale = d3.scaleLinear()
	                            .domain([0, 5])
	                            .range([0, -1 * h/3]);

	    x_scale = d3.scaleLinear()
	                            .domain([d3.min(Commons.floormap_outer.flat(), d=>parseFloat(d[0])),
	                                     d3.max(Commons.floormap_outer.flat(), d=>parseFloat(d[0])),])
	                            .range([padding.l, w - padding.r])
	                            .clamp(true);
	    y_scale = d3.scaleLinear()
	                            .domain([d3.min(Commons.floormap_outer.flat(), d=>parseFloat(d[1])),
	                                     d3.max(Commons.floormap_outer.flat(), d=>parseFloat(d[1])),])
	                            .range([h - padding.b, padding.t])
	                            .clamp(true);

	    color = d3.scaleSequential(d3.interpolateYlOrRd);
	    color_scale = d3.scaleLinear()
	                            .domain(d3.extent(data_values))
	                            .range([0, 1]);

	    origin = [x_scale.range()[0]+15, y_scale.range()[0]]
	    yScale3dInner.origin(origin);
	    cubes3D.origin(origin);
	    yScale3dOuter.origin(origin);

	    d3.range(5).forEach(function(id) {
	        yLineInner[id] = [];
	        yLineOuter[id] =[];
	        cubesData[id] =[];
	        for(let i=0;i<Commons.floormap_inner.length; i++){
	            yLineInner[id].push([x_scale(parseFloat(Commons.floormap_inner[i][0][0])), 1,
	                                 y_scale(parseFloat(Commons.floormap_inner[i][0][1]))]);

	        }

	        for(let i=0;i<Commons.floormap_outer.length; i++){
	            yLineOuter[id].push([x_scale(parseFloat(Commons.floormap_outer[i][0][0])),1,
	                                 y_scale(parseFloat(Commons.floormap_outer[i][0][1]))])
	        }

	        for(let i=0; i<Commons.sensor_coords[id].length; i++) {
	        	var sid = Commons.sensor_coords[id][i][0];
	            if(viz_data.value.hasOwnProperty(sid) === true) {
		            let x=x_scale(parseFloat(Commons.sensor_coords[id][i][2]));
		            let z=y_scale(parseFloat(Commons.sensor_coords[id][i][3]));
		            let h=height_scale(hs(viz_data.value[sid]));
		            let _cube=makeCube(h,x,z);
		            _cube.id=sid;
		            _cube.color=color(color_scale(parseFloat(viz_data.value[sid])));

		            cubesData[id].push(_cube);
		        }
	        }

	        let data = [
	            yScale3dInner([yLineInner[id]]),
	            yScale3dOuter([yLineOuter[id]]),
	            cubes3D(cubesData[id])
	        ];
	        processData(id, data, 250);
	    });
	}

	return mod;
})(DashboardFloorViz || {}, Commons, DashboardInteraction, window, document);