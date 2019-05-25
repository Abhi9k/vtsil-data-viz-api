; var OMAViz = (function(mod, Commons, DOCUMENT, WINDOW) {

	mod.initView = function() {};

	mod.fetchDataAndDraw = function(start_date, end_date) {};

})(OMAViz || {}, Commons, document, window);


function ondataexportclick() {
	var start_date = d3.select('#dtp_input_1').attr('value');
	var end_date = d3.select('#dtp_input_2').attr('value');
	var fname = prompt("Enter a unique file name:", "explore_data");
	var api = "/api/oma?f="+start_date+"&t="+end_date+"&fname="+fname;
	d3.json(api).then(function(resp) {});
}

d3.select('#oma-fetch')
    .on('click', function() {
        var start_date = d3.select('#dtp_input_1').attr('value');
        var end_date = d3.select('#dtp_input_2').attr('value');
        OMAViz.fetchDataAndDraw(start_date, end_date);
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

    OMAViz.initView();
});