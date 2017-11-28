// Commented out for prototyping in the browser's console
"use strict"

// Main data object and crossfilter reference
let data = new Object();
let xf;

// Performance timers
let startTime = new Date();
let downloadTime;
let reformatTime;

// References to UI objects
let map;

function createMarkerPie(nkill, nwound, clustersize) {
    let len = 32;
    let svg = d3.select(document.createElement("div"))
    //let svg = d3.select("body")
        .append("svg")
        .attr("width", len)
        .attr("height", len);
    if(nkill + nwound != 0) {
        svg.append("circle")
            .attr("r", len/2)
            .attr("cx", len/2)
            .attr("cy", len/2)
            .attr("fill", "red");
        svg.append("path")
            .attr("d", d3.svg.arc()
                .innerRadius(0)
                .outerRadius(len/2)
                .startAngle(0)
                .endAngle(nwound / (nwound + nkill) * Math.PI * 2))
            .attr("fill", "orange")
            .attr("transform", `translate(${len/2},${len/2})`);
    }
    let circle = svg.append("circle")
        .attr("r", len*2/5)
        .attr("cx", len/2)
        .attr("cy", len/2)
        .attr("fill", "white");
    if(nkill + nwound == 0) {
        circle.attr("stroke", "black");
    }
    if (clustersize === void 0) {
        svg.append("text")
            .attr("x", len/2)
            .attr("y", len/2)
            .attr("dy", 6)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text(clustersize);
    }

    return svg;
}

function main() {
    d3.select("body")
        .append("h1")
        .text("Terr💣vizm");

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

        // Load data on the map
        loadMap();
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

    // Transform data from unlabled array to an object
    let eventKeys = Object.keys(columns);
    data.events = json.events.map(x => _.object(eventKeys, x));

    // Create the Leaflet markers once and for all
    data.events.map(function(x) {
        x["marker"] = new PruneCluster.Marker(
            x.latitude,
            x.longitude,
            {
                "icon": function(data, category){
                    return new L.divIcon({
                        html: createMarkerPie(x.nkill, x.nwound).node().outerHTML,
                        iconAnchor: [16, 16],
                        className: "killwoundmarker"
                    });
                },
                "popup": `<h2>${(new Date(x.date)).toDateString()}</h2>
                <h3>Casualties</h3>
                <ul>
                    <li>Killed: ${x.nkill}</li>
                    <li>Wounded: ${x.nwound}</li>
                    <li>Suicide: ${x.suicide ? "yes" : "no"}</li>
                </ul>
                <h3>Target(s)</h3>
                <ul>
                    ${x.targtype.reduce((acc, y) => `<li>${data.refs.targtype[y]}</li>`, "")}
                </ul>
                <h3>Weapons(s)</h3>
                <ul>
                    ${x.weaptype.reduce((acc, y) => `<li>${data.refs.weaptype[y]}</li>`, "")}
                </ul>
                <h3>More…</h3>
                <a href="http://www.start.umd.edu/gtd/search/IncidentSummary.aspx?gtdid=${x.eventid}" target="_blank">Details</a>`
            },
            null,
            true);
        map.pruneCluster.RegisterMarker(x.marker);
        return x;
    });

    // Fill-in the data crossfiltered
    xf = crossfilter(data.events);
    xf.lat = xf.dimension(x => x.latitude),
    xf.lon = xf.dimension(x => x.longitude);

    // Log
    reformatTime = new Date();
    console.log("Reformatting of data finished", `Time ${(reformatTime - downloadTime)/1000} seconds`);
}

function loadMap() {
    // Log
    console.log("Start load markers in map");
    let t1 = new Date();

    //let topLats = xf.lat.top(5);
    map.pruneCluster.RedrawIcons();

    // Log
    let t2 = new Date();
    console.log("Time in ms: ", t2-t1);
}

function setupMap() {
    d3.select("body")
        .append("div")
        .attr("id","map");

    map = L.map('map').setView([0, 0], 2);

    L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add the map filtering
    let locationFilter = new L.LocationFilter().addTo(map);
    locationFilter.on("change", function (e) {
        console.log("Bounds changed", e.bounds);

    });
    locationFilter.on("enabled", function () {
        console.log("Geofilter enabled");
    });
    locationFilter.on("disabled", function () {
        console.log("Geofilter disabled");
    });

    // Create and add the PruneCluster layer
    map["pruneCluster"] = new PruneClusterForLeaflet(100, 20);
    map.addLayer(map.pruneCluster);
}
