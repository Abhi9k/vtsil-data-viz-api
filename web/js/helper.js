function getDimensions(id) {
    let width = document.getElementById(id).getBoundingClientRect().width;
    let height = document.getElementById(id).getBoundingClientRect().height;
    let y = document.getElementById(id).getBoundingClientRect().y;
    let x = document.getElementById(id).getBoundingClientRect().x;
    return [width,height,x,y];
}

var ondataexportclick = function() {
            console.log("so you want to export something!!");
}
var onundoselectionclick = function() {
            console.log("so you want to undo something!!");
}

var onviztypechanged = function() {
    var select = document.getElementById('select-viz-type');
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var value = selected.textContent;
    if(value==='Individual') {
    	window.location="http://128.173.25.223/explore";
    }
    if(value==='Live') {
    	window.location="http://128.173.25.223/";
    }
    console.log(key+","+value);
}

var onrefreshintervalclick = function() {
    console.log("so you want to change refresh interval!!");
}