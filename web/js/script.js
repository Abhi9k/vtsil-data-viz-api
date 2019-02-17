var web_worker,v1_data,v2_data,v3_data,W,H;
var sid_floor_mapping = {"133": "3", "91": "3", "131": "3", "130": "3", "137": "3", "136": "5", "135": "3", "90": "3", "139": "5", "138": "5", "93": "3", "24": "5", "25": "5", "86": "4", "92": "3", "20": "3", "21": "3", "22": "5", "23": "5", "95": "3", "28": "2", "29": "5", "94": "3", "4": "2", "8": "2", "96": "3", "87": "5", "120": "3", "121": "3", "122": "3", "123": "3", "124": "3", "125": "3", "126": "3", "127": "3", "128": "3", "129": "3", "59": "1", "58": "1", "132": "3", "55": "2", "54": "2", "57": "1", "56": "3", "51": "2", "50": "2", "53": "2", "52": "2", "179": "4", "134": "3", "195": "1", "194": "1", "197": "1", "196": "1", "191": "1", "190": "1", "193": "1", "192": "1", "115": "4", "114": "4", "88": "3", "89": "3", "111": "4", "110": "4", "113": "5", "176": "3", "82": "3", "83": "3", "80": "3", "81": "3", "119": "3", "118": "3", "84": "3", "85": "3", "141": "5", "27": "5", "3": "2", "7": "2", "26": "5", "178": "4", "108": "3", "109": "4", "102": "3", "103": "3", "100": "3", "101": "3", "106": "3", "107": "3", "104": "3", "105": "3", "39": "2", "38": "1", "33": "1", "32": "1", "31": "1", "30": "1", "37": "2", "36": "2", "35": "1", "34": "1", "60": "1", "61": "2", "62": "2", "63": "2", "64": "2", "65": "2", "66": "2", "67": "2", "68": "3", "69": "3", "175": "4", "174": "4", "173": "1", "172": "1", "171": "1", "170": "1", "181": "3", "182": "3", "183": "3", "180": "3", "2": "2", "186": "3", "187": "1", "184": "3", "6": "2", "188": "1", "189": "1", "97": "3", "185": "3", "99": "3", "98": "3", "168": "1", "169": "1", "164": "1", "165": "1", "166": "1", "167": "1", "160": "1", "161": "1", "162": "1", "163": "1", "11": "2", "10": "2", "13": "2", "12": "2", "15": "3", "14": "2", "17": "3", "16": "3", "19": "3", "18": "3", "117": "3", "116": "3", "151": "4", "150": "4", "153": "4", "152": "4", "155": "3", "154": "5", "157": "3", "156": "3", "159": "1", "158": "3", "112": "4", "48": "1", "49": "2", "46": "1", "47": "1", "44": "2", "45": "1", "42": "2", "43": "2", "40": "2", "41": "2", "1": "2", "5": "2", "9": "2", "146": "4", "147": "4", "144": "5", "145": "4", "142": "5", "143": "5", "140": "5", "177": "4", "148": "4", "149": "4", "77": "4", "76": "5", "75": "3", "74": "3", "73": "3", "72": "3", "71": "3", "70": "3", "79": "3", "78": "4"};
var f1_sensors = ["164", "166", "167", "162", "163", "195", "194", "197", "196", "191", "190", "193", "192", "38", "33", "32", "31", "30", "35", "34", "60", "168", "169", "165", "160", "161", "47", "59", "58", "57", "173", "172", "171", "170", "187", "188", "189", "159", "48", "46", "45"].sort(function(a,b){return +a-+b});
var f2_sensors = ["8", "3", "39", "37", "36", "61", "62", "63", "64", "65", "66", "67", "6", "41", "1", "9", "28", "4", "55", "54", "51", "50", "53", "52", "7", "11", "10", "13", "12", "14", "49", "44", "42", "43", "40", "5", "2"].sort(function(a,b){return +a-+b});
var f3_sensors = ["90", "95", "94", "120", "121", "122", "123", "124", "125", "126", "127", "128", "129", "108", "102", "103", "100", "101", "106", "107", "104", "105", "68", "69", "99", "98", "91", "93", "92", "97", "96", "133", "132", "131", "130", "137", "135", "134", "20", "21", "56", "88", "116", "82", "83", "80", "81", "84", "85", "176", "182", "183", "180", "181", "186", "184", "185", "15", "17", "16", "19", "18", "117", "89", "155", "157", "156", "158", "119", "118", "75", "74", "73", "72", "71", "70", "79"].sort(function(a,b){return +a-+b});
var f4_sensors = ["109", "146", "147", "145", "148", "149", "115", "114", "111", "110", "112", "86", "179", "178", "177", "175", "174", "151", "150", "153", "152", "77", "78"].sort(function(a,b){return +a-+b});
var f5_sensors = ["144", "142", "143", "140", "141", "136", "139", "138", "24", "25", "26", "27", "22", "23", "29", "113", "87", "154", "76"].sort(function(a,b){return +a-+b});

function onWebWorkerMessage(event) {
    msg=event.data;
    if(msg[0]==='v1data') {
        v3_data = msg[1];
        v1_data = v3_data[v3_data.length-1];
        drawV1();
        drawV3();
    }
    if(msg[0]==='v2data') {
        v2_data = msg[1];
        drawV2();
    }
}

function startWebWorker() {
    if(typeof(Worker) !== "undefined") {
        if(typeof(web_worker) == "undefined") {
            web_worker = new Worker("js/web_worker.js");
        }
        web_worker.onmessage = onWebWorkerMessage;
    } else {}
}

function getDimensions(id) {
    let width = document.getElementById(id).getBoundingClientRect().width;
    let height = document.getElementById(id).getBoundingClientRect().height;
    let y = document.getElementById(id).getBoundingClientRect().y;
    let x = document.getElementById(id).getBoundingClientRect().x;
    return [width,height,x,y];
}

function getSVGElementCenter(box) {
    return [box.width/2 + box.x, box.height/2 + box.y];
}

startWebWorker();

(function updateVisualization() {
    web_worker.postMessage(['updateV1']);
    web_worker.postMessage(['updateV2']);
})();

window.addEventListener("DOMContentLoaded", function() {
    d3.select
    initV2();
    initV1();
    initV3();
    W = window.innerWidth;
    H = window.innerHeight;
    initInteraction();
    update();
});



function update() {
    if(v2_data!==undefined && v3_data!==undefined) {
        updateV2Data();
        updateV3Data();
        v1_data = v3_data[v3_data.length-1];
        drawV1()
        drawV2();
        updateV3();
    }
    setTimeout(update, 5000);
}

function updateV2Data() {
    v2_data=v2_data.map(
        function(d) {
            d.data=d.data.map(
                        function(dd) {
                            dd.p = d3.randomUniform(dd.p/2, 2*dd.p)();
                            return dd;
                        });
            return d;
        });
}

function updateV3Data() {
    var random_pos = Math.round(d3.randomUniform(0,v3_data.length)());
    var new_data = JSON.parse(JSON.stringify(v3_data[random_pos]));
    d3.range(1,198).forEach(
        function(i) {
            new_data.value[i] = d3.randomUniform(new_data.value[i]/2,2*new_data.value[i])();
    });
    last_date=new Date(v3_data[v3_data.length-1].ts);
    new_data.ts = last_date.setSeconds(last_date.getSeconds()+5);
    v3_data.shift();
    v3_data.push(new_data);
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
    console.log(key+","+value);
}

var onrefreshintervalclick = function() {
    console.log("so you want to change refresh interval!!");
}