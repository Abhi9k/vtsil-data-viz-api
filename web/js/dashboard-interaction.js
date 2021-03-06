; var DashboardInteraction = (function(mod, Commons, WINDOW, DOCUMENT) {
	var is_zoomed=false, is_hovered=false;
	mod.is_hovered = false;

	mod.latest_time = '';


	mod.zoomInView = function(view_id_1, view_id_2, module) {
			if(is_zoomed===true)
				return;
			is_zoomed=true;
			// view_id_1 is zoomed-in and view_id_2 is removed
			d3.select('#'+view_id_2+"-parent")
				.classed('hidden', true);
			d3.select('#'+view_id_1+"-parent")
				.classed('hidden', false);
			d3.select('#'+view_id_1).select('svg').remove();
			d3.select('#'+view_id_1+"-parent")
				.style('height',"75%");

			module.initView();
			module.draw();			
	};


	mod.resetZoom = function() {
			if(is_zoomed===false)
				return;
			is_zoomed=false;
			d3.select('#v2-parent')
				.classed('hidden', false);
			d3.select('#v3-parent')
				.classed('hidden', false);
			d3.select('#v2-parent')
				.style('height',"45%");
			d3.select('#v3-parent')
				.style('height',"30%");
			d3.select('#v2').select('svg').remove();
			d3.select('#v3').select('svg').remove();

			DashboardTimeseriesViz.initView();
			DashboardSpectrumViz.initView();
			DashboardTimeseriesViz.draw();
			DashboardSpectrumViz.draw();
	};


	mod.init = function(W, H) {

	};


	mod.moveToFloorViz = function(floor_num) {
		WINDOW.open('/floorwise?f='+floor_num, '_blank');
	}

	mod.moveToExploreViz = function(data) {
		WINDOW.open('/explore?id='+Commons.sensor_info[data.id].daq_name, '_blank');
	}

	mod.commonMouseover = function(item, d, type) {
		mod.is_hovered = true;
		d3.select('#tooltip')
			.classed('hidden', false);
		d3.selectAll(".sensor"+d.id).dispatch("hovered", {"detail": {"id": d.id}});
	};

	mod.commonMouseout = function(item, d, type) {
		mod.is_hovered = false;
		d3.select('#tooltip')
			.classed('hidden', true);
		d3.selectAll(".sensor"+d.id).dispatch("unhovered", {"detail": {"id": d.id}});
	};

	mod.updateTooltip = function(data, position) {
		position=Commons.calculateTooltipPosition(position[0],position[1], Commons.W, Commons.H);
		d3.select('#tooltip')
			.style('left', (position[0]+10)+"px")
			.style('top', (position[1]+10)+"px");
		d3.select('#key').text(data[0]);
		d3.select('#value1').text(data[1].key+": "+data[1].value);
		if(data.length>=3) {
			d3.select('#value2').text(data[2].key+": "+data[2].value);
		}else{
			d3.select('#value2').text(" ");
		}
	};

	mod.selectedAnimation = function(sx, sy) {
		var circle = svg.append('circle')
			.attr('r',20)
			.attr('cx', sx)
			.attr('cy', sy)
			.attr('opacity', 0.75)
			.attr('fill', 'steelblue')
			.transition()
			.duration(1000)
				.attr('cx', button_x)
				.attr('cy', button_y)
				.attr('r', 0)
			.remove();
	};

	return mod;
})(DashboardInteraction || {}, Commons, window, document);