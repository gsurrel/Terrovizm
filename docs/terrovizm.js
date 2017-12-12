// Commented out for prototyping in the browser's console
"use strict"

// Main data object and crossfilter reference
let data = new Object();
let xf;

// Ready flag
let ready = false;

// References to map class instance
let mapT;

// Welcome screen status
let welcome = true;

function main() {
    createIntroductionSymbols();
    updateLoader();
    mapT = new TerroMap();

    let dataLoader = new Worker('dataLoader.js');
    dataLoader.postMessage({"dateString": "2017-11-25", "imports": ["d3.v3.min.js", "underscore.min.js"]});
    dataLoader.onmessage = function(e) {
        let t1 = new Date();
        console.log("Transmitting data from worker finished");
        // Save the data sent from the worker
        let dataWorker = JSON.parse(e.data);
        data["refs"] = dataWorker.refs;

        let t2 = new Date();
        console.log("Parsed data from worker", t2-t1);

        // Complete the icon marker generation
        dataWorker.events.map(function(x) {
            // Create the marker icon in the right spot before destructuring
            let markerSize = TerroMap.markerSize(x.nkill+x.nwound);
            x.marker[2].icon = (() => new L.divIcon({
                html: TerroMap.createMarkerPie(x.nkill, x.nwound, (x.nkill+x.nwound)==0,
                markerSize).node().outerHTML,
                iconAnchor: [markerSize/2, markerSize/2],
                className: "killwoundmarker"
            }));
            x.marker[2].popup = (() => TerroMap.createrMarkerText(x));

            // Create markers in the PruneCluser destructuring the returned data
            x.marker = new PruneCluster.Marker(...x.marker);
            mapT.pruneCluster.RegisterMarker(x.marker);
            return x;
        });

        let t3 = new Date();
        console.log("Instantiated marker data", t3-t2);

        // Fill-in the data crossfiltered
        xf = crossfilter(dataWorker.events);
        xf.lat = xf.dimension(x => x.latitude),
        xf.lon = xf.dimension(x => x.longitude);

        mapT.refreshMarkers();

        createRowPlots();
        createStackedPlots();
        createSummaries();

        ready = true;

        // Hook on dc to refresh the map when filters are applied on barcharts or timeline
        dc.chartRegistry.list().forEach(chart => chart.on('filtered', refreshView));
    };
}

function refreshView(){
    mapT.refreshMarkers();
    dc.redrawAll();

    // Test if markers are in view (needs conversion to bounds used by PruneCLuster)
    let b = mapT.map.getBounds();
    let markers = mapT.pruneCluster.Cluster.FindMarkersInArea(
        {"minLat": b.getSouth(),
        "maxLat": b.getNorth(),
        "minLng": b.getWest(),
        "maxLng": b.getEast()
    });
    let markersInView = markers.reduce((acc, x) => acc + !(x.filtered), 0);
    let markersOnMap = mapT.pruneCluster.GetMarkers().reduce((acc, x) => acc + !(x.filtered), 0);
    if(markersInView == 0 && markersOnMap != 0) {
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
        }
    }

    function createSummaries(){
        let all = xf.groupAll();
        let evCount = dc.dataCount('#selected-events')
        .dimension(xf)
        .group(all)
        .html({
            some: 'Selected <strong>%filter-count</strong> attacks out of <strong>%total-count</strong> records' +
            '<span class="reset" onclick="javascript:dc.filterAll(); dc.renderAll();">Reset all</span>',
            all: 'All records selected. Please click on bar charts or select a time range to apply filters.'
        });
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
