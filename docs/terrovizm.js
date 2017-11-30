// Commented out for prototyping in the browser's console
"use strict"

// Main data object and crossfilter reference
let data = new Object();
let xf;

// Ready flag
let ready = false;

// References to map class instance
let mapT;

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
    if(ready) window.setTimeout((() => document.getElementById("loader").style.display = "none"), 500);
    if(!ready) {
        window.setTimeout(updateLoader, 200*Math.random()+100);
    }
}

function main() {
    d3.select("body")
        .append("h1")
        .text("Terr💣vizm");

    updateLoader();
    mapT = new TerroMap();

    let dataLoader = new Worker('dataLoader.js');
    dataLoader.postMessage({"dateString": "2017-11-25", "imports": ["d3.v3.min.js", "underscore.min.js"]});
    dataLoader.onmessage = function(e) {
        let t1 = new Date();
        console.log("Transmitting data from worker finished");
        // Save the data sent from the worker
        let dataWorker = JSON.parse(e.data);

        let t2 = new Date();
        console.log("Parsed data from worker", t2-t1);

        // Complete the icon marker generation
        dataWorker.events.map(function(x) {
            // Create the marker icon in the right spot before destructuring
            x.marker[2].icon = (() => new L.divIcon({
                    html: TerroMap.createMarkerPie(x.nkill, x.nwound, 32).node().outerHTML,
                    iconAnchor: [16, 16],
                    className: "killwoundmarker"
                }));
            x.marker[2].marker = (() => TerroMap.createrMarkerText(x));

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

        ready = true;
    }
}
