// Commented out for prototyping in the browser's console
//"use strict"

// Main data object
let data = new Object();

// Performance timers
let startTime = new Date();
let downloadTime;
let reformatTime;

// References to UI objects
let map;

function main() {
    d3.select("body")
        .append("h1")
        .text("Terrovizm");

    setupMap();

    let dateString = "2017-11-25";
    console.log("Loading data", dateString);

    d3.json(`db-${dateString}.json`, function(error, json) {
        // Log
        if (error) return console.error(error);
        downloadTime = new Date();
        console.log("Download and parsing finished", `Time ${(downloadTime - startTime)/1000} seconds`);

        // Process data
        reformatData(json);

        // TODO: Load in crossbar

        // created barplots
        createBarPlots();
    });
}

function reformatData(json) {
    // We did not use a dictionnary for the events to save network space.
    // Let's recreate a nice data structure.

    // Split the columns names apart, then all the refs are fine
    let columns = json.refs.columns;
    delete json.refs.columns;
    data.refs = json.refs;

    // Set unknown days and months to 1st day and month
    json.events.map(function(x) {
        x[columns.date].filter(y => y == 0).map(y => y = 1);
        x[columns.date][1]--; // Months start at 0 and not 1
        return x;
    });

    // Create the date in the iyear field, which we rename
    json.events.map(function(x) {
        x[columns.date] = Date.UTC(...x[columns.date]);
        return x;
    });

    // Fill-in the data crossfiltered
    let eventKeys = Object.keys(columns);
    data.events = crossfilter(json.events.map(x => _.object(eventKeys, x)));

    // Log
    reformatTime = new Date();
    console.log("Reformatting of data finished", `Time ${(reformatTime - downloadTime)/1000} seconds`);
}

function setupMap() {
    d3.select("body")
        .append("div")
        .attr("id","map");

    map = L.map('map').setView([0, 0], 1);

    L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function createBarPlots(){
    d3.select("body")
        .append("div")
        .attr("id","row-plots");

   let countryDim = data.events.dimension(function(d){return data.refs.country[d.country];}),
       regionDim = data.events.dimension(function(d){return data.refs.region[d.region];}),
       suicideDim = data.events.dimension(function(d){return d.suicide == 0 ? "Yes" : "No";}),
       attackTypeDim = data.events.dimension(function(d){return d.attacktype}, true),
       targTypeDim = data.events.dimension(function(d){return d.targtype.map(tar => data.refs.targtype[tar])},true),
       weapTypeDim = data.events.dimension(function (d) {return d.weaptype},true),
       gnameDim = data.events.dimension(function(d){return d.gname}, true),
       countryGroup = countryDim.group(),
       regionGroup = regionDim.group(),
       suicideGroup = suicideDim.group(),
       attackTypeGroup = attackTypeDim.group(),
       targTypeGroup = targTypeDim.group(),
       weapTypeGroup = weapTypeDim.group(),
       gnameGroup = gnameDim.group();

   console.log(attackTypeGroup.top(Infinity));
   d3.select("#row-plots")
       .append("div")
       .attr("id", "attack-bar-plot");
   let attackTypeRowPlot = dc.rowChart("#attack-bar-plot")
       .renderLabel(true)
       .height(200)
       .width(250)
       .dimension(attackTypeDim)
       .group(attackTypeGroup)
       .cap(10)
       .ordering(d => -d.value)
       .xAxis().ticks(1);

   console.log(weapTypeGroup.top(Infinity));
   d3.select("#row-plots")
       .append("div")
       .attr("id","weapon-bar-plot");
   let weapTypeRowPlot = dc.rowChart("#weapon-bar-plot")
       .renderLabel(true)
       .height(200)
       .width(250)
       .dimension(weapTypeDim)
       .group(weapTypeGroup)
       .cap(10)
       .ordering(d => -d.value)
       .xAxis().ticks(1);

   dc.renderAll();
}