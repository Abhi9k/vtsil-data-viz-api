// home page js

var is_live=true;
var curr_view="current";
var f_from=1;
var f_to=128;
var time_from;
var time_to;
var selected_sensor;
var chart_type="hmap";
var heatmapInitialized=false;
var bargraphInitialized=false;
var streamgraphInitialized=false;
var seriesData=[];
var streamData=[];
var sensorMetadata={};
abs_min=0.0000000000002;
abs_max=0.00000006;
var timeseriesData=[];

function getStreamgraphTimerange() {
    timerange="2017-12-02T13:00:00/2017-12-02T13:30:00";
    if(time_from!==undefined && time_to!==undefined)
        timerange=time_from+"/"+time_to;
    return timerange;
}
const colorScale = d3.scaleQuantile()
  .domain([0.0000000000005 ,0.00000005, 0.000009])
  .range(['#fee8c8', '#fdbb84','#e34a33']);

function getSensorMetadata(sensor_id) {
    if(sensorMetadata[sensor_id]!==undefined)
        return sensorMetadata[sensor_id];

}
function initSensorMetadata() {
    d3.range(1,198).forEach(function(sid) {
        worker.postMessage(["sensorMetadata",sid]);
    });
}

d3.select('.colorLegend').append('svg')
    .attr("width", "275")
    .attr("height", "20")
    .selectAll('rect')
    .data([0.0000000000005 ,0.00000005, 0.000009])
    .enter().append("rect")
        .attr("width",275/3)
        .attr("height","20")
        .attr("x",(d,i)=>i*(275/3))
        .attr("y",3)
        .attr("fill", colorScale)
        .append("text")
            // .attr("x",(d,i)=>i*(275/3)+10)
            // .attr("y",10)
            .text(function(d,i) {
                return ["LOW","MED","HIGH"][i];
            });


function sensorMouseOver(d) {
    metadata=sensorMetadata[d];
    d3.select("#tooltip-sensor").classed("hidden",false);
    d3.select("#tooltip-sensor")
     .style("left", (d3.event.pageX+30) + "px")
     .style("top", (d3.event.pageY-30) + "px");
    d3.select("#tooltip-sensor-id").text("ID: "+d);
    d3.select("#tooltip-sensor-name").text("Name: "+metadata['daq_name']);
    d3.select("#tooltip-sensor-bias_level").text("Bias Level: "+metadata['bias_level']);
    d3.select("#tooltip-sensor-orientation").text("Orientation: "+metadata['orientation']);
}
function sensorMouseOut(d) {
    d3.select("#tooltip-sensor").classed("hidden",true);
}

function setChartTypeColor(ctype) {
    if(ctype==="hmap") {
        d3.select('.hmap').style("background-color","#C8E6C9");
        d3.select('.bar').style("background-color","#FFFDE7");
        d3.select('#bar-svg').style("display","none");
        d3.select('#hmap-svg').style("display","block");
    }
    else {
        d3.select('.bar').style("background-color","#C8E6C9");
        d3.select('.hmap').style("background-color","#FFFDE7");
        d3.select('#bar-svg').style("display","block");
        d3.select('#hmap-svg').style("display","none");
    }
}
setChartTypeColor(chart_type);
d3.select('.hmap')
    .style("background-color",function() {
        if(chart_type==="hmap") return "#C8E6C9";
    })
    .on("click",function() {
        if(chart_type==="hmap")
            chart_type="bar";
        else
            chart_type="hmap";
        setChartTypeColor(chart_type);
    });
d3.select('.bar')
    .style("background-color",function() {
        if(chart_type==="bar") return "#C8E6C9";
    })
    .on("click",function() {
        if(chart_type==="hmap") {
            chart_type="bar";
            setChartTypeColor(chart_type);
            if(bargraphInitialized===false)
                initBarGraph();

        }
        else {
            chart_type="hmap";
            setChartTypeColor(chart_type);

        }
        
    });
d3.select('.dropdown')
    .on('change', function() {
        curr_view=d3.select('.dropdown')._groups[0][0].value;
        if(curr_view==="time-series" && time_from!==undefined && time_to!==undefined && f_from!==undefined && f_to!==undefined) {
            part_url=time_from+"/"+time_to+"/"+f_from+"/"+f_to+"/"+selected_sensor;
            worker.postMessage(["timeseriesData",part_url]);
            d3.select('.visualizations').style("display","none");
            d3.select('.timeseries').style("display","block");
            initTimeseries();
        } else {
            d3.select('.visualizations').style("display","block");
            d3.select('.timeseries').style("display","none");
        }
    });
d3.select("#live")
    .on("click", function() {
        d3.select(this).style("background-color", function() {
            is_live=(!is_live);
            if(is_live)
                return "green";
            else
                return "red";
        });
    })

d3.select("#submit")
    .on('click', function() {
        time_to=d3.select('#time-to')._groups[0][0].value;
        time_from=d3.select('#time-from')._groups[0][0].value;
        f_from=d3.select('#f-from')._groups[0][0].value;
        f_to=d3.select('#f-to')._groups[0][0].value;
        selected_sensor=d3.select('#sensor-id')._groups[0][0].value;
        // console.log(time_to,time_from,f_to,f_from);
        if(canShowView("current")) {
            worker.postMessage(["updateStreamGraph",getStreamgraphTimerange()]);
        }
        else {
            part_url=time_from+"/"+time_to+"/"+f_from+"/"+f_to+"/"+selected_sensor;
            worker.postMessage(["timeseriesData",part_url]);
        }
    });

function canShowView(vname) {
    return vname===curr_view;
}

var worker;
var power_data;
var heat_map_data;
var floormap_data_outer;
var floormap_data_inner;
var first_floor_sensor_locations;
var second_floor_sensor_locations;
var third_floor_sensor_locations;
var fourth_floor_sensor_locations;
var fifth_floor_sensor_locations;
var sensor_location_data;
var sid_to_floor;



const vis1 = d3.select('#floor1').select('svg').call(d3.drag().on('drag', dragged).on('start', dragStart).on('end', dragEnd)).append('g').attr("stroke","black");
const vis2 = d3.select('#floor2').select('svg').call(d3.drag().on('drag', dragged).on('start', dragStart).on('end', dragEnd)).append('g').attr("stroke","black");
const vis3 = d3.select('#floor3').select('svg').call(d3.drag().on('drag', dragged).on('start', dragStart).on('end', dragEnd)).append('g').attr("stroke","black");
const vis4 = d3.select('#floor4').select('svg').call(d3.drag().on('drag', dragged).on('start', dragStart).on('end', dragEnd)).append('g').attr("stroke","black");
const vis5 = d3.select('#floor5').select('svg').call(d3.drag().on('drag', dragged).on('start', dragStart).on('end', dragEnd)).append('g').attr("stroke","black");
const xscale=d3.scaleLinear()
            .domain([-30,50])
            .range([20,250])
            .clamp(true);
const yscale=d3.scaleLinear()
            .domain([-30,50])
            .range([50,200])
            .clamp(true);


const heightScale = d3.scaleLinear()
  .domain([0.0000000000005 , 0.000009])
  .range([-1,-100])
  .clamp(true);


var origin = [100, 170],xGrid=[],beta = 0, cubesData = [[],[],[],[],[]], yLineInner=[[],[],[],[],[]], yLineOuter=[[],[],[],[],[]],alpha = 0, yStartAngle = -0.6624662769526304,xStartAngle=0.37562520858138826;
var mx, my, mouseX, mouseY;


var cubesGroup1 = vis1.append('g').attr('class', 'cubes');
var cubesGroup2 = vis2.append('g').attr('class', 'cubes');
var cubesGroup3 = vis3.append('g').attr('class', 'cubes');
var cubesGroup4 = vis4.append('g').attr('class', 'cubes');
var cubesGroup5 = vis5.append('g').attr('class', 'cubes');

var cubes3D = d3._3d()
    .shape('CUBE')
    .x(function(d){ return d.x; })
    .y(function(d){ return d.y; })
    .z(function(d){ return d.z; })
    .rotateY(yStartAngle)
    .rotateX(xStartAngle)
    .origin(origin);

var yScale3dInner = d3._3d()
    .shape('LINE_STRIP')
    .origin(origin)
    .rotateX(xStartAngle)
    .rotateY(yStartAngle);

var yScale3dOuter = d3._3d()
    .shape('LINE_STRIP')
    .origin(origin)
    .rotateX(xStartAngle)
    .rotateY(yStartAngle);

// heatmap viz code

var heatmap_width;
var heatmap_height;

var barchart_width;
var barchart_height;

var cubeWidth;
var cubeHeight;

var heatmap_svg;

var heatmap;

var heatMapXScale;
var heatMapYScale;
var xAxis;
var yAxis;

function initHeatmapVar() {
    heatmapInitialized=true;
    heatmap_width=document.getElementById("hmap-svg").getBoundingClientRect().width;
    heatmap_height=document.getElementById("hmap-svg").getBoundingClientRect().height;

    barchart_width=document.getElementById("bar-svg").getBoundingClientRect().width;
    barchart_height=document.getElementById("bar-svg").getBoundingClientRect().height;

    cubeWidth=(heatmap_width-26)/197;
    cubeHeight=(heatmap_height-18)/129;

    heatmap_svg=d3.select('.upper-viz').select('svg');

    heatmap=heatmap_svg.append('g')
                    .attr('stroke','black')
                    .attr('fill','none');

    heatMapXScale=d3.scaleLinear().domain([1,197]).range([26,heatmap_width-cubeWidth]);
    heatMapYScale=d3.scaleLinear().domain([0,128]).range([18,heatmap_height-cubeHeight]);
    xAxis=d3.axisTop(heatMapXScale).ticks(30);
    yAxis=d3.axisLeft(heatMapYScale).ticks(30);  
    heatmap_svg.append('g').attr("transform","translate(0,18)").attr("class","axis").call(xAxis);
    heatmap_svg.append('g').attr("transform","translate(26,0)").attr("class","axis").call(yAxis); 
}
// heatmap_svg.append('g').attr("transform","translate(26,18)").attr("class","axis").call(xAxis);
// heatmap_svg.append('g').attr("transform","translate(26,18)").attr("class","axis").call(yAxis);

var rectMouseover=function(item, d) {
    id=d[0];
    d3.select(item).classed("cell-hover",true);
    d3.select("#tooltip").classed("hidden", false);
     var tooltip= d3.select("#tooltip")
         .style("left", (d3.event.pageX-200-30) + "px")
         .style("top", (d3.event.pageY-30) + "px");
     tooltip.select('#frequency').style("display","none");
     tooltip.select('#power').style("display","none");
     tooltip.select('#date').style("display","none");
     tooltip.select("#sid").text("Sensor ID: "+id)

     if(d[2]!==undefined) {
        tooltip.select('#power').style("display","block");
        tooltip.select('#power').text("Power: "+d[2])
    }
     if(d[1]!==undefined) {
        tooltip.select('#frequency').style("display","block");
        tooltip.select('#frequency').text("Frequency: "+d[1]);
    }

    if(d.length>3 && d[3]!==undefined) {
       tooltip.select('#date').style("display","block"); 
       tooltip.select('#date').text("Time: "+d[3]);
    }

     tooltip.select('#floor').text("Floor: "+sid_to_floor[id]);
     cubeGroup = getCubesGroup(+sid_to_floor[id]);

     // if(cubeGroup!==undefined) {
         cubeGroup.selectAll('g.cube').dispatch("selected", {"detail": {"id": id}});
     // }
}

var rectMouseout=function(item, d) {
    id=d[0];
    d3.select(item).classed("cell-hover",false);
    d3.select("#tooltip").classed("hidden", true);
    cubeGroup = getCubesGroup(+sid_to_floor[id]);
    // if(cubeGroup!==undefined)
    cubeGroup.selectAll('g.cube').dispatch("unselected", {"detail": {"id": id}});
}

function updateChart(heat_map_data) { 
    if(heatmapInitialized===false) {
        initHeatmapVar();
        heatmapInitialized=true;
    }
    var rects = heatmap.selectAll("rect")
                        .data(heat_map_data);
    rects.exit().remove();
    rects.enter()
            .append('rect')
            .attr("transform","translate(26,18)")
            .attr('x',d=>(+d[0])*cubeWidth)
            .attr('y',d=>(+d[1])*cubeHeight)
            .attr('height',cubeHeight)
            .attr('width',cubeWidth)
            .attr('stroke','none')
            .style("fill", function(d) { return colorScale(d[2]); })
            .on('mouseover', function(d) {
                return rectMouseover(this,d);
            })
            .on('mouseout', function(d) {
                return rectMouseout(this,d);
            });
    rects.style("fill", function(d) { return colorScale(d[2]); });
}


// stacked bar chart code

(function initAll() {
    time_to=d3.select('#time-to')._groups[0][0].value;
    time_from=d3.select('#time-from')._groups[0][0].value;
    f_from=d3.select('#f-from')._groups[0][0].value;
    f_to=d3.select('#f-to')._groups[0][0].value;
    selected_sensor=d3.select('#sensor-id')._groups[0][0].value;
    startWorker();
    worker.postMessage(["initData"]);
    initSensorMetadata();
    worker.postMessage(["updateStreamGraph",getStreamgraphTimerange()]);

    floormap_data_outer=[[['0', '0'], ['11.14', '0']],
     [['11.14', '0'], ['11.14', '3.79']],
     [['11.14', '3.79'], ['17.33', '3.79']],
     [['17.33', '3.79'], ['43.16', '3.59']],
     [['43.16', '3.59'], ['49.57', '3.59']],
     [['49.57', '3.59'], ['49.57', '32.09']],
     [['49.57', '32.09'], ['34.27', '32.21']],
     [['34.27', '32.21'], ['34.27', '36.13']],
     [['34.27', '36.13'], ['11.14', '36.13']],
     [['11.14', '36.13'], ['11.14', '38.22']],
     [['11.14', '38.22'], ['-27.58', '38.22']],
     [['-27.58', '38.22'], ['-26.23', '-26.1']],
     [['-26.23', '-26.1'], ['-13.19', '-26.1']],
     [['-13.19', '-26.1'], ['-13.19', '-19.85']],
     [['-13.19', '-19.85'], ['-0.15', '-19.85']],
     [['-0.15', '-19.85'], ['0', '0']],
     [['0', '0'], ['11.14', '0']],
     [['11.14', '0'], ['11.14', '3.79']],
     [['11.14', '3.79'], ['17.33', '3.79']],
     [['17.33', '3.79'], ['43.16', '3.59']],
     [['43.16', '3.59'], ['49.57', '3.59']],
     [['49.57', '3.59'], ['49.57', '32.21']],
     [['49.57', '32.21'], ['34.27', '32.21']],
     [['34.27', '32.21'], ['34.27', '36.13']],
     [['34.27', '36.13'], ['11.14', '36.13']],
     [['11.14', '36.13'], ['11.14', '38.22']],
     [['11.14', '38.22'], ['-27.58', '38.22']],
     [['-27.58', '38.22'], ['-26.23', '-26.1']],
     [['-26.23', '-26.1'], ['-13.19', '-26.1']],
     [['-13.19', '-26.1'], ['-13.19', '-19.85']],
     [['-13.19', '-19.85'], ['-0.15', '-19.85']],
     [['-0.15', '-19.85'], ['0', '0']],
     [['0', '0'], ['11.14', '0']]];

    floormap_data_inner=[
     [['17.158', '11.973'], ['36.364', '11.867']],
     [['36.364', '11.867'], ['36.364', '25.379']],
     [['36.364', '25.379'], ['-3.791', '25.379']],
     [['-3.791', '25.379'], ['-14.126', '25.44']],
     [['-14.126', '25.44'], ['-14.126', '31.979']],
     [['-14.126', '31.979'], ['-22.379', '31.979']],
     [['-22.379', '31.979'], ['-22.379', '16']],
     [['-22.379', '16'], ['-2.6105', '13.9865']],  
     [['-2.6105', '13.9865'], ['17.158', '11.973']],
     [['17.158', '11.973'], ['36.364', '11.867']]];


first_floor_sensor_locations=[[30, "1", 30.402, 32.224, 0.85], [31, "1", 33.338, 33.558, 1.0], [32, "1", 30.132, 33.839, 0.855], [33, "1", 32.027, 26.336, -0.045], [34, "1", 33.262, 25.235, 0.865], [35, "1", 34.272, 32.215, 0.86], [38, "1", 41.276, 26.274, 0.85], [45, "1", -27.579, 38.2236, 0.729], [46, "1", -27.579, 38.2236, 0.729], [47, "1", -13.188, 32.167, 0.73], [48, "1", -13.188, 32.167, 0.73], [57, "1", 33.247, 23.577, 0.855], [58, "1", 39.666, 25.083, 0.845], [59, "1", 39.643, 23.57, 0.835], [60, "1", 29.959, 12.62, 0.34], [159, "1", -26.2272, -26.1048, 0.379], [160, "1", -26.2272, -26.1048, 0.379], [161, "1", -26.2272, -26.1048, 0.379], [162, "1", -0.151, -19.849, 0.375], [163, "1", -0.151, -19.849, 0.375], [164, "1", -0.151, -19.849, 0.375], [165, "1", 49.57, 32.093, -0.1], [166, "1", 49.57, 32.093, -0.1], [167, "1", 43.161, 3.594, 0.465], [168, "1", 49.57, 32.093, -0.1], [169, "1", 11.1386, 36.1319, -0.34003], [170, "1", 11.1386, 36.1319, -0.34003], [171, "1", 11.1386, 36.1319, -0.34003], [172, "1", 43.161, 3.594, 0.465], [173, "1", 43.161, 3.594, 0.465], [187, "1", -9.8476, 12.8672, 0.379], [188, "1", -9.8476, 12.8672, 0.379], [189, "1", -9.8476, 12.8672, 0.379], [190, "1", -10.9272, -3.349, 0.379], [191, "1", -10.9272, -3.349, 0.379], [192, "1", -10.9272, -3.349, 0.379], [193, "1", -27.579, 38.2236, 0.729], [194, "1", 17.33, 3.793, -0.015], [195, "1", 17.33, 3.793, -0.015], [196, "1", 17.33, 3.793, -0.015], [197, "1", 13.967, 13.844, 0.76]];
second_floor_sensor_locations=[[1, "2", -28.366, -28.537, 5.362], [2, "2", -28.366, -28.537, 5.362], [3, "2", -28.366, -28.537, 5.362], [4, "2", -0.581, -19.413, 5.497], [5, "2", -21.537, 3.14, 5.412], [6, "2", -21.537, 3.14, 5.412], [7, "2", -21.537, 3.14, 5.412], [8, "2", -27.818, 38.645, 4.722], [9, "2", -27.818, 38.645, 4.722], [10, "2", -14.277, 32.185, 5.297], [11, "2", -27.818, 38.645, 4.722], [12, "2", -21.133, -9.647, 5.427], [13, "2", -6.883, -16.185, 5.417], [14, "2", -9.616, -3.38, 5.382], [28, "2", -14.277, 32.185, 5.297], [36, "2", 11.226, 36.107, 4.412], [37, "2", 11.226, 36.107, 4.412], [39, "2", 49.462, 32.208, 4.851], [40, "2", 49.462, 32.208, 4.851], [41, "2", 49.462, 32.208, 4.851], [42, "2", 11.226, 36.107, 4.412], [43, "2", 42.685, 3.754, 4.857], [44, "2", 42.685, 3.754, 4.857], [49, "2", -0.005, -0.448, 4.867], [50, "2", -0.005, -0.448, 4.867], [51, "2", -0.005, -0.448, 4.867], [52, "2", -0.581, -19.413, 5.497], [53, "2", -0.581, -19.413, 5.497], [54, "2", 13.942, 10.367, 5.392], [55, "2", 26.787, 13.09, 5.417], [61, "2", 42.685, 3.754, 4.857], [62, "2", 17.096, 4.236, 5.452], [63, "2", 17.096, 4.236, 5.452], [64, "2", 17.096, 4.236, 5.452], [65, "2", 20.444, 21.364, 5.407], [66, "2", 20.444, 21.364, 5.407], [67, "2", 20.444, 21.364, 5.407]];
third_floor_sensor_locations=[[15, "3", 42.766, 4.084, 10.161], [16, "3", 42.766, 4.084, 10.161], [17, "3", 42.766, 4.084, 10.161], [18, "3", 17.168, 4.969, 10.001], [19, "3", 17.168, 4.969, 10.001], [20, "3", 17.168, 4.969, 10.001], [21, "3", 20.495, 26.227, 9.996], [56, "3", 0.099, 3.952, 9.921], [68, "3", -0.38, 16.037, 9.839], [69, "3", -0.302, 21.905, 9.816], [70, "3", -0.304, 18.963, 9.826], [71, "3", -0.327, 29.349, 9.851], [72, "3", -0.316, 26.601, 9.831], [73, "3", -2.483, 21.921, 9.811], [74, "3", -2.456, 29.36, 9.836], [75, "3", -2.487, 26.613, 9.826], [79, "3", 20.516, 31.403, 9.981], [80, "3", 20.509, 32.086, 9.981], [81, "3", 23.683, 30.602, 10.001], [82, "3", 23.702, 31.387, 9.996], [83, "3", 17.305, 30.649, 9.966], [84, "3", 17.326, 32.063, 9.941], [85, "3", 20.504, 30.611, 9.981], [88, "3", -7.639, -16.236, 9.896], [89, "3", -9.532, -3.708, 10.096], [90, "3", -27.76, 38.492, 9.236], [91, "3", -19.338, 0.451, 10.116], [92, "3", -19.338, 0.451, 10.116], [93, "3", -17.143, -9.671, 9.956], [94, "3", -19.338, 0.451, 10.116], [95, "3", 1.4, 3.952, 9.911], [96, "3", 8.212, 28.375, 9.811], [97, "3", 8.253, 29.481, 9.886], [98, "3", 5.586, 31.554, 9.876], [99, "3", 14.106, 31.447, 9.981], [100, "3", 8.283, 31.496, 9.876], [101, "3", 10.866, 31.362, 9.918], [102, "3", 2.912, 30.534, 9.886], [103, "3", 2.903, 31.584, 9.891], [104, "3", 30.098, 30.682, 9.811], [105, "3", 20.495, 26.227, 9.996], [106, "3", 20.495, 26.227, 9.996], [107, "3", 30.084, 32.075, 9.811], [108, "3", 30.094, 31.326, 9.811], [116, "3", 6.371, 3.92, 9.906], [117, "3", 0.28, -0.235, 9.221], [118, "3", 0.28, -0.235, 9.221], [119, "3", 0.28, -0.235, 9.221], [120, "3", -0.579, -19.376, 9.236], [121, "3", 1.697, -28.643, 9.236], [122, "3", -0.579, -19.376, 9.236], [123, "3", -0.579, -19.376, 9.236], [124, "3", 41.627, 26.548, 9.966], [125, "3", 41.627, 26.548, 9.966], [126, "3", 1.697, -28.643, 9.236], [127, "3", 1.697, -28.643, 9.236], [128, "3", 36.349, 4.185, 10.051], [129, "3", 23.554, 4.282, 10.136], [130, "3", 29.936, 4.211, 10.216], [131, "3", 2.911, 29.53, 9.896], [132, "3", 0.295, 31.652, 9.866], [133, "3", 6.037, 15.753, 10.116], [134, "3", 6.037, 15.753, 10.116], [135, "3", 6.037, 15.753, 10.116], [137, "3", 41.627, 26.548, 9.966], [155, "3", -14.33, 32.172, 9.236], [156, "3", -27.76, 38.492, 9.236], [157, "3", -14.33, 32.172, 9.236], [158, "3", -27.76, 38.492, 9.236], [176, "3", 10.771, 4.942, 10.051], [180, "3", -0.32, 16.015, 9.836], [181, "3", 10.715, 36.127, 8.996], [182, "3", 10.715, 36.127, 8.996], [183, "3", 10.715, 36.127, 8.996], [184, "3", 48.9637, 34.222, 9.236], [185, "3", 48.9637, 34.222, 9.236], [186, "3", 48.9637, 34.222, 9.236]];
fourth_floor_sensor_locations=[[77, "4", -27.488, 39.031, 13.855], [78, "4", 10.852, 35.941, 13.82], [86, "4", 10.852, 35.941, 13.82], [109, "4", 33.18, 19.699, 14.535], [110, "4", 20.4, 20.061, 14.52], [111, "4", 20.4, 20.061, 14.52], [112, "4", 20.4, 20.061, 14.52], [114, "4", 26.72, 14.093, 14.525], [115, "4", 13.927, 14.778, 14.495], [145, "4", 48.9637, 34.222, 13.796], [146, "4", 48.9637, 34.222, 13.796], [147, "4", 48.9637, 34.222, 13.796], [148, "4", 42.571, 3.486, 13.915], [149, "4", 42.571, 3.486, 13.915], [150, "4", 42.571, 3.486, 13.915], [151, "4", 16.997, 4.297, 14.61], [152, "4", 16.997, 4.297, 14.61], [153, "4", 16.997, 4.297, 14.61], [174, "4", -27.488, 39.031, 13.855], [175, "4", -27.488, 39.031, 13.855], [177, "4", -13.561, 32.568, 13.635], [178, "4", -13.561, 32.568, 13.635], [179, "4", 10.852, 35.941, 13.82]];
fifth_floor_sensor_locations=[[22, "5", 17.158, 11.973, 19.112], [23, "5", 36.364, 11.867, 20.083], [24, "5", 36.364, 11.867, 20.083], [25, "5", 21.458, 16.172, 22.057], [26, "5", 21.458, 16.172, 22.057], [27, "5", 17.158, 11.973, 19.112], [29, "5", 34.229, 15.926, 21.932], [76, "5", 34.229, 15.926, 21.932], [87, "5", 17.158, 11.973, 19.112], [113, "5", 36.364, 11.867, 20.083], [136, "5", -22.379, 31.979, 19.517], [138, "5", -3.791, 25.379, 19.497], [139, "5", -3.791, 25.379, 19.497], [140, "5", -22.379, 31.979, 19.517], [141, "5", -14.126, 25.44, 19.507], [142, "5", -14.126, 25.44, 19.507], [143, "5", -14.126, 25.44, 19.507], [144, "5", -3.791, 25.379, 19.497], [154, "5", -22.379, 31.979, 19.517]];
sid_to_floor={"133": "3", "91": "3", "131": "3", "130": "3", "137": "3", "136": "5", "135": "3", "90": "3", "139": "5", "138": "5", "93": "3", "24": "5", "25": "5", "86": "4", "92": "3", "20": "3", "21": "3", "22": "5", "23": "5", "95": "3", "28": "2", "29": "5", "94": "3", "4": "2", "8": "2", "96": "3", "87": "5", "120": "3", "121": "3", "122": "3", "123": "3", "124": "3", "125": "3", "126": "3", "127": "3", "128": "3", "129": "3", "59": "1", "58": "1", "132": "3", "55": "2", "54": "2", "57": "1", "56": "3", "51": "2", "50": "2", "53": "2", "52": "2", "179": "4", "134": "3", "195": "1", "194": "1", "197": "1", "196": "1", "191": "1", "190": "1", "193": "1", "192": "1", "115": "4", "114": "4", "88": "3", "89": "3", "111": "4", "110": "4", "113": "5", "176": "3", "82": "3", "83": "3", "80": "3", "81": "3", "119": "3", "118": "3", "84": "3", "85": "3", "141": "5", "27": "5", "3": "2", "7": "2", "26": "5", "178": "4", "108": "3", "109": "4", "102": "3", "103": "3", "100": "3", "101": "3", "106": "3", "107": "3", "104": "3", "105": "3", "39": "2", "38": "1", "33": "1", "32": "1", "31": "1", "30": "1", "37": "2", "36": "2", "35": "1", "34": "1", "60": "1", "61": "2", "62": "2", "63": "2", "64": "2", "65": "2", "66": "2", "67": "2", "68": "3", "69": "3", "175": "4", "174": "4", "173": "1", "172": "1", "171": "1", "170": "1", "181": "3", "182": "3", "183": "3", "180": "3", "2": "2", "186": "3", "187": "1", "184": "3", "6": "2", "188": "1", "189": "1", "97": "3", "185": "3", "99": "3", "98": "3", "168": "1", "169": "1", "164": "1", "165": "1", "166": "1", "167": "1", "160": "1", "161": "1", "162": "1", "163": "1", "11": "2", "10": "2", "13": "2", "12": "2", "15": "3", "14": "2", "17": "3", "16": "3", "19": "3", "18": "3", "117": "3", "116": "3", "151": "4", "150": "4", "153": "4", "152": "4", "155": "3", "154": "5", "157": "3", "156": "3", "159": "1", "158": "3", "112": "4", "48": "1", "49": "2", "46": "1", "47": "1", "44": "2", "45": "1", "42": "2", "43": "2", "40": "2", "41": "2", "1": "2", "5": "2", "9": "2", "146": "4", "147": "4", "144": "5", "145": "4", "142": "5", "143": "5", "140": "5", "177": "4", "148": "4", "149": "4", "77": "4", "76": "5", "75": "3", "74": "3", "73": "3", "72": "3", "71": "3", "70": "3", "79": "3", "78": "4"};
sensor_location_data=[first_floor_sensor_locations,second_floor_sensor_locations,third_floor_sensor_locations,fourth_floor_sensor_locations,fifth_floor_sensor_locations];

    setChartTypeColor(chart_type);
})();

function startWorker() {
    if(typeof(Worker) !== "undefined") {
        if(typeof(worker) == "undefined") {
            worker = new Worker("/js/webWork.js");
        }
        worker.onmessage = function(event) {
            let data=event.data;
            if(data[0]==="initData"){
                power_data=data[1];
                heat_map_data=data[2];
                initFloors('1',floormap_data_inner, floormap_data_outer);
                initFloors('2',floormap_data_inner, floormap_data_outer);
                initFloors('3',floormap_data_inner, floormap_data_outer);
                initFloors('4',floormap_data_inner, floormap_data_outer);
                initFloors('5',floormap_data_inner, floormap_data_outer);
                if(chart_type==="hmap") {
                    if(heatmapInitialized===false)
                        initHeatmapVar();
                    updateChart(heat_map_data);
                }
                else {
                    updateBarGraph(heat_map_data);
                }
            }
            if(data[0]==="updateStream") {
                power_data=data[1];
                heat_map_data=data[2];
                if(chart_type==="hmap") {
                    if(heatmapInitialized===false)
                        initHeatmapVar();
                    updateChart(heat_map_data);
                }
                else {
                    updateBarGraph(heat_map_data);
                }
            }
            if(data[0]==="updateSeries") {
                if(bargraphInitialized===false){
                    initBarGraph();
                    bargraphInitialized=true;
                }
                seriesData=data[1];
                updateBarGraph(seriesData);
            }
            if(data[0]==="updateStreamGraph") {
                if(streamgraphInitialized===false) {
                    initStreamGraph();
                }
                streamData=data[1]['data'];
                updateStreamGraph(streamData);
            }
            if(data[0]==="sensorMetadata") {
                sensorMetadata[data[1]]=data[2];
            }
            if(data[0]==="timeseriesData") {
                timeseriesData=data[1];
                updateTimeseries(timeseriesData);
            }
        };
    } else {
        
    }
}

function dragStart(){
    mx = d3.event.x;
    my = d3.event.y;
}

function dragged(){
	let id=this.id;
    mouseX = mouseX || 0;
    mouseY = mouseY || 0;
    beta   = (d3.event.x - mx + mouseX) * Math.PI / 230 ;
    alpha  = (d3.event.y - my + mouseY) * Math.PI / 230  * (-1);
    let data = [
        yScale3dInner.rotateY(beta + yStartAngle)([yLineInner[+id -1]]),
        yScale3dOuter.rotateY(beta + yStartAngle)([yLineOuter[+id -1]]),
        cubes3D.rotateY(beta + yStartAngle)(cubesData[+id -1])
    ];
    processData(id,data, 0);
}

function dragEnd(){
    mouseX = d3.event.x - mx + mouseX;
    mouseY = d3.event.y - my + mouseY;
}

function getParent(id) {
	return [undefined,vis1,vis2,vis3,vis4,vis5][id];
}

function getCubesGroup(id) {
    return [undefined,cubesGroup1,cubesGroup2,cubesGroup3,cubesGroup4,cubesGroup5][id];
}

function processData(id, data, tt){
	let parent=getParent(id);
	let cubesGroup=getCubesGroup(id);
	var cubes = cubesGroup.selectAll('g.cube').data(data[2], function(d){ return d.id });
    var yScaleInner = parent.selectAll('path.yScaleInner').data(data[0]);

    var ce = cubes
        .enter()
        .append('g')
        .merge(cubes)
        .attr('class', 'cube')
        .attr("fill","steelblue")
        .attr('stroke', "steelblue")
        .on("selected", function(d) {
            sid=d3.event.detail.id;
            if(+sid===d.id) {
                currCube=d3.select(this);
                currCube.attr("fill","red");
                currCube.attr("stroke","red");
            }
        })
        .on("unselected", function(d,i) {
            sid=d3.event.detail.id;
            if(+sid===d.id) {
                currCube=d3.select(this);
                currCube.attr("fill","steelblue");
                currCube.attr("stroke","steelblue");
            }
        })
        .on("mouseover", function(d) {
            return sensorMouseOver(d.id);
        })
        .on("mouseout", function(d) {
            return sensorMouseOut(d.id);
        });

    var faces = cubes.merge(ce).selectAll('path.face').data(function(d){ return d.faces; }, function(d){ return d.face; });

    faces.enter()
        .append('path')
        .merge(faces)
        .attr('class', 'face')
        .classed('_3d', true)
        .transition().duration(tt)
        .attr('d', cubes3D.draw);

    yScaleInner
        .enter()
        .append('path')
        .attr('class', '_3d yScaleInner')
        .merge(yScaleInner)
        .attr('stroke', 'black')
        .attr('stroke-width', .5)
        .attr('fill','none')
        .attr('d', yScale3dInner.draw);

    var yScaleOuter = parent.selectAll('path.yScaleOuter').data(data[1]);

    yScaleOuter
        .enter()
        .append('path')
        .merge(yScaleOuter)
        .attr('class', '_3d yScaleOuter')
        .attr('stroke', 'black')
        .attr('stroke-width', .5)
        .attr('fill','none')
        .attr('d', yScale3dOuter.draw);
}

function initFloors(id, inner_outline, outer_outline){
    var cnt = 0;
    yLineInner[+id-1] = [];
    yLineOuter[+id-1] =[];
    cubesData[+id -1] =[];
    for(let i=0;i<inner_outline.length; i++){
    	yLineInner[+id-1].push([xscale(inner_outline[i][0][0]),1,yscale(inner_outline[i][0][1])]);

    }
    for(let i=0;i<outer_outline.length; i++){
    	yLineOuter[+id-1].push([xscale(outer_outline[i][0][0]),1,yscale(outer_outline[i][0][1])])
    }

    for(let i=0;i<sensor_location_data[+id-1].length; i++) {
    	let x=xscale(sensor_location_data[+id-1][i][2]);
    	let z=yscale(sensor_location_data[+id-1][i][3]);
        let hraw;

        if(power_data===undefined || power_data===null)
            hraw=0.0000000000005;
        else
            hraw=power_data[sensor_location_data[+id-1][i][0]]
    	let h=heightScale(hraw);
    	let _cube=makeCube(h,x,z);
    	_cube.id=sensor_location_data[+id-1][i][0];
    	_cube.height=h;
    	cubesData[+id-1].push(_cube);

    }

    let data = [
        yScale3dInner([yLineInner[+id-1]]),
        yScale3dOuter([yLineOuter[+id-1]]),
        cubes3D(cubesData[+id-1])
    ];
    processData(id, data, 1000);
}

function makeCube(h, x, z){
    return [
        {x: x - 2, y: h, z: z + 2}, // FRONT TOP LEFT
        {x: x - 2, y: 0, z: z + 2}, // FRONT BOTTOM LEFT
        {x: x + 2, y: 0, z: z + 2}, // FRONT BOTTOM RIGHT
        {x: x + 2, y: h, z: z + 2}, // FRONT TOP RIGHT
        {x: x - 2, y: h, z: z - 2}, // BACK  TOP LEFT
        {x: x - 2, y: 0, z: z - 2}, // BACK  BOTTOM LEFT
        {x: x + 2, y: 0, z: z - 2}, // BACK  BOTTOM RIGHT
        {x: x + 2, y: h, z: z - 2}, // BACK  TOP RIGHT
    ];
}

(function updateVisualization() { 
    // processStreamDataSync(resp.data,resp.freqs);
    initFloors('1',floormap_data_inner, floormap_data_outer);
    initFloors('2',floormap_data_inner, floormap_data_outer);
    initFloors('3',floormap_data_inner, floormap_data_outer);
    initFloors('4',floormap_data_inner, floormap_data_outer);
    initFloors('5',floormap_data_inner, floormap_data_outer);
    if(chart_type==="hmap" && canShowView("current"))
        worker.postMessage(["updateStream"]);
    else if(chart_type==="bar" && canShowView("current"))
        worker.postMessage(["updateSeries"]);
    if(canShowView("current"))
        setTimeout(updateVisualization,20000);
})();



