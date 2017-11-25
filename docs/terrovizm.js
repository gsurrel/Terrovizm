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

    let dateString = "2017-11-24";
    console.log("Loading data", dateString);

    d3.json(`db-${dateString}.json`, function(error, json) {
        // Log
        if (error) return console.error(error);
        downloadTime = new Date();
        console.log("Download and parsing finished", `Time ${(downloadTime - startTime)/1000} seconds`);

        // Process data
        reformatData(json);

        // TODO: Load in crossbar

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
    json.events.filter(x => x[columns.iday] == 0).map(x => x[columns.iday] = 1);
    json.events.filter(x => x[columns.imonth] == 0).map(x => x[columns.imonth] = 1);

    // Create the date in the iyear field, which we rename
    let imonth = columns["imonth"], iday = columns["iday"];
    json.events.map(function(x) {
        x[columns.iyear] = Date.UTC(
            x[columns.iyear],
            x[columns.imonth]-1,
            x[columns.iday]);
        x.splice(imonth, 1);
        x.splice(iday, 1)
        return x;
    });
    columns[columns["iyear"]] = "date";
    columns = _.omit(columns, ['imonth', 'iday']);

    // Create a placeholder object
    let eventKeys = Object.values(columns).filter(x => _.isString(x));

    // Fill-in the data object
    data.events = json.events.map(x => _.object(eventKeys, x));

    // Remove date leftovers
    data.events = data.events.map(function(x) {
        x.date = Date.UTC(x.iyear, x.imonth-1, x.iday);
        return _.omit(x, ['iyear', 'imonth', 'iday']);
    });

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
