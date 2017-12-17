// Commented out for prototyping in the browser's console
"use strict"

// Crossfilter reference
let xf;

// References for number <-> string mappings
let refs;

// Global summaries
let victimsSummaries;

// Ready flag
let ready = false;

// References to visual objects
let mapT;
let plotsConf;

// Welcome screen status
let welcome = true;

function main() {
    createIntroductionSymbols();
    updateLoader();
    mapT = new TerroMap();

    let startTime = new Date();
    d3.json(`db-2017-11-25.json`, function(error, json) {
        // Log
        if (error) return console.error(error);
        let downloadTime = new Date();
        console.log("Download and parsing finished", downloadTime - startTime);

        // Process data
        json = reformatData(json);

        // Fire up everything
        startViz(json);
    });

}

function reformatData(json) {
    let downloadTime = new Date();
    // We did not use a dictionnary for the events to save network space.
    // Let's recreate a nice data structure.

    // Split the columns names apart, then all the refs are fine
    let columns = json.refs.columns;
    refs = json.refs;

    // Set unknown days and months to 1st day and month
    json.events.map(function(x) {
        x[columns.date].filter(y => y == 0).map(y => y = 1);
        x[columns.date][1]--; // Months start at 0 and not 1
        return x;
    });

    // Create the date in the iyear field, which we rename
    json.events.map(function(x) {
        x[columns.date] = new Date(...x[columns.date]);
        return x;
    });

    // Transform data from unlabled array to an object
    let eventKeys = Object.keys(columns);
    let data = json.events.map(x => _.object(eventKeys, x));

    // Replace the references with the full names
    data.map(function(d) {
        d.region = refs.region[d.region];
        d.country = refs.country[d.country];
        d.attacktype = d.attacktype.map(x => refs.attacktype[x]);
        d.targtype = d.targtype.map(x => refs.targtype[x]);
        d.weaptype = d.weaptype.map(x => refs.weaptype[x]);
        d.suicide = d.suicide == 1 ? "Yes" : "No";
        return d;
    });

    // Create the Leaflet markers once and for all
    data.map(function(x) {
        let markerSize = TerroMap.markerSize(x.nkill+x.nwound);
        let extras = {
            icon: (() => new L.divIcon({
                html: TerroMap.createMarkerPie(x.nkill, x.nwound, (x.nkill+x.nwound)==0, markerSize).node().outerHTML,
                iconAnchor: [markerSize/2, markerSize/2],
                className: "killwoundmarker"
            })),
            popup: (() => TerroMap.createrMarkerText(x)),
            nkill: x.nkill,
            nwound: x.nwound,
        };
        x["marker"] = new PruneCluster.Marker(
            x.latitude,
            x.longitude,
            extras
        );
        return x;
    });

    // Log processing time
    let reformatTime = new Date();
    console.log("Reformatting of data finished", reformatTime - downloadTime);

    return data;
}


function startViz(data) {
    let t2 = new Date();

    data.map(x => mapT.pruneCluster.RegisterMarker(x.marker));

    let t3 = new Date();
    console.log("Instantiated marker data", t3-t2);

    // Fill-in the data crossfiltered
    xf = crossfilter(data);
    // Create references and crossfilter dimensions
    plotsConf = [
        [[d => d.region], ["region-row-plot", Infinity, "Attacks by region"]],
        [[d => d.country], ["country-row-plot", 10, "Attacks by country"]],
        [[d => d.gname, true], ["gname-row-plot", 15, "Terrorist group"]],
        [[d => d.attacktype, true], ["attacktype-row-plot", 10, "Type of attacks"]],
        [[d => d.targtype], ["targtype-row-plot", 10, "Type of target"]],
        [[d => d.weaptype,true], ["weaptype-row-plot", 10, "Type of weapon"]],
        [[d => d.suicide], ["suicide-row-plot", Infinity, "Suicide attacks"]],
    ];
    xf.lat = xf.dimension(x => x.latitude),
    xf.lon = xf.dimension(x => x.longitude);
    //let dims = [];
    //dims.push(xf.dimension(...plotsConf[0][0]));
    // Create dimensions for bar charts
    plotsConf.map(x => x[1].push(xf.dimension(...x[0])));

    mapT.refreshMarkers();

    createRowPlots(plotsConf);
    //createRangePlot();
    createSummaries();

    ready = true;

    // Hook on dc to refresh the map when filters are applied on barcharts or timeline
    dc.chartRegistry.list().forEach(chart => chart.on('filtered', refreshView));
    refreshView();
};


function refreshView(){
    mapT.refreshMarkers();
    dc.redrawAll();

    // Update the heatmap data
    mapT.heatmapLayer.clear();
    let mapDataPoints = mapT.pruneCluster.Cluster.GetMarkers().filter((x) => !(x.filtered));
    if(mapDataPoints.length != 0) {mapT.heatmapLayer.addData(mapDataPoints);}

    // Test if markers are in view (needs conversion to bounds used by PruneCLuster)
    let b = mapT.map.getBounds();
    let markers = mapT.pruneCluster.Cluster.FindMarkersInArea(
        {"minLat": b.getSouth(),
        "maxLat": b.getNorth(),
        "minLng": b.getWest(),
        "maxLng": b.getEast()
    });
    let markersInView = markers.filter((x) => !(x.filtered));
    let numMarkersInView = markersInView.length;
    if(numMarkersInView == 0) {
        let markersOnMap = mapT.pruneCluster.GetMarkers().reduce((acc, x) => acc + !(x.filtered), 0);
        if(markersOnMap != 0) {
            let zoomToMarkers = window.confirm('No attacks in this area. Show the attacks?');
            if(zoomToMarkers) {
                let minLat = xf.lat.bottom(1)[0].latitude;
                let maxLat = xf.lat.top(1)[0].latitude;
                let minLng = xf.lon.bottom(1)[0].longitude;
                let maxLng = xf.lon.top(1)[0].longitude;
                mapT.map.flyToBounds(L.latLngBounds(
                    L.latLng(minLat, minLng),
                    L.latLng(maxLat, maxLng)));
                }
            } else {
                let resetFilters = window.confirm('All attacks are filtered out. Remove all filters?');
                if(resetFilters) {
                    dc.filterAll();
                    dc.renderAll();
                    mapT.map.flyToBounds(mapT.locationFilter.getBounds());
                }
            }
        }

        // update the summaries
        d3.select('#selected-events-details')
        .html(`#killed <strong>${victimsSummaries.value()['nkill'].toLocaleString()}</strong> - #wounded <strong>${victimsSummaries.value()['nwound'].toLocaleString()}</strong>`)
    }

    function filterAll(){
        dc.chartRegistry.list().forEach(chart => {
            if(chart.hasFilter()){
                chart.filterAll();
                chart.redraw();
            }
        });
    }

    function createSummaries(){
        let all = xf.groupAll();
        let evCount = dc.dataCount('#selected-events')
        .dimension(xf)
        .group(all)
        .html({
            some: 'Selected <strong>%filter-count</strong> attacks out of <strong>%total-count</strong> records' +
            '<span class="reset" onclick="javascript:filterAll();">Reset all</span>',
            all: 'All records selected. Please click on bar charts or select a time range to apply filters.'
        });
        victimsSummaries = xf.groupAll();
        victimsSummaries = victimsSummaries.reduce(
            (p,v) => {
                p['nkill'] += v['nkill'];
                p['nwound'] += v['nwound'];
                return p;
            },
            (p,v) => {
                p['nkill'] -= v['nkill'];
                p['nwound'] -= v['nwound'];
                return p;
            },
            () =>{return {nkill:0, nwound:0};}
        );
    }

    function updateLoader() {
        let strings = ["Downloading terrorists",
        "Planning evil plots",
        "Building master plan",
        "Contacting law enforcment",
        "Downloading cocktails molotov",
        "Freeing hostages",
        "Investigating really hard",
        "Imposing massive surveillance",
    ];
    document.getElementById("footer").textContent = strings[Math.floor(Math.random()*strings.length)];
    if(ready) document.getElementById("footer").innerHTML = "<span id='close' onclick='document.getElementById(\"loader\").style.display = \"none\"'>Close</span>";
    if(!ready) {
        window.setTimeout(updateLoader, 200*Math.random()+100);
    }
}

function createIntroductionSymbols() {
    let markerSize = TerroMap.markerSize(10);
    d3.select("#event_icon_dead")   .node().appendChild(TerroMap.createMarkerPie(4, 0, false, markerSize).node());
    d3.select("#event_icon_wounded").node().appendChild(TerroMap.createMarkerPie(0, 4, false, markerSize).node());
    d3.select("#event_icon_mixed")  .node().appendChild(TerroMap.createMarkerPie(1, 3, false, markerSize).node());
    d3.select("#event_icon_noharm") .node().appendChild(TerroMap.createMarkerPie(0, 0, true, markerSize).node());
    d3.select("#cluster_icon_mixed").node().appendChild(TerroMap.createMarkerPie(1, 3, false, markerSize, 16).node());
    d3.select("#cluster_icon_hard") .node().appendChild(TerroMap.createMarkerPie(1, 3, 8, markerSize, 16).node());
    d3.select("#cluster_icon_small").node().appendChild(TerroMap.createMarkerPie(8, 2, 2, TerroMap.markerSize(8+2), 20).node());
    d3.select("#marker_icon_medium").node().appendChild(TerroMap.createMarkerPie(150, 350, false, TerroMap.markerSize(150+350)).node());
    d3.select("#cluster_icon_big")  .node().appendChild(TerroMap.createMarkerPie(8000, 2000, 14, TerroMap.markerSize(8000+2000), 20).node());
    d3.select("#cluster_icon_huge") .node().appendChild(TerroMap.createMarkerPie(40000, 60000, 600, TerroMap.markerSize(40000+60000), 3213).node());
}

function toggleWelcomeScreen() {
    document.getElementById("loader").style.display = (welcome = !welcome) ? "block" : "none";
}
