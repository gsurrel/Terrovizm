"use strict"

class TerroMap {
    // References to UI objects
    constructor() {
        this.map = L.map('map').setView([0, 0], 2);

        L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Add the map filtering
        let locationFilter = new L.LocationFilter().addTo(this.map);
        locationFilter.on("change", function (e) {
            xf.lat.filter([e.bounds.getSouth(), e.bounds.getNorth()]);
            xf.lon.filter([e.bounds.getWest(), e.bounds.getEast()]);
            refreshView();
        });
        locationFilter.on("enabled", function () {
            let bounds = locationFilter.getBounds();
            xf.lat.filter([bounds.getSouth(), bounds.getNorth()]);
            xf.lon.filter([bounds.getWest(), bounds.getEast()]);
            refreshView();
        });
        locationFilter.on("disabled", function () {
            xf.lat.filter(null);
            xf.lon.filter(null);
            refreshView();
        });

        // Create and add the PruneCluster layer
        this.pruneCluster = new PruneClusterForLeaflet(100, 20);
        PruneCluster.Cluster.ENABLE_MARKERS_LIST = true
        this.pruneCluster.BuildLeafletClusterIcon = function(cluster) {
            let markers = cluster.GetClusterMarkers();
            let nkill = markers.reduce((acc, x) => acc + x.data.nkill, 0);
            let nwound = markers.reduce((acc, x) => acc + x.data.nwound, 0);
            let novictims = markers.reduce((acc, x) => acc + ((x.data.nkill + x.data.nwound) == 0), 0);
            let iconSize = TerroMap.markerSize(nkill+nwound);
            return new L.divIcon({
                html: TerroMap.createMarkerPie(nkill, nwound, novictims, iconSize, cluster.population).node().outerHTML,
                iconAnchor: [iconSize/2, iconSize/2],
                className: "killwoundmarker"
            });
        };
        this.map.addLayer(this.pruneCluster);
    }

    static createrMarkerText(event) {
        return `<h2>${(new Date(event.date)).toDateString()}</h2>
        <h3>Casualties</h3>
        <ul>
            <li>Killed: ${event.nkill}</li>
            <li>Wounded: ${event.nwound}</li>
            <li>Suicide: ${event.suicide ? "yes" : "no"}</li>
        </ul>
        <h3>Target(s)</h3>
        <ul>
            ${event.targtype.reduce((acc, y) => `<li>${data.refs.targtype[y]}</li>`, "")}
        </ul>
        <h3>Weapons(s)</h3>
        <ul>
            ${event.weaptype.reduce((acc, y) => `<li>${data.refs.weaptype[y]}</li>`, "")}
        </ul>
        <h3><a href="http://www.start.umd.edu/gtd/search/IncidentSummary.aspx?gtdid=${event.eventid}" target="_blank">More…</a></h3>`;
    }

    static createMarkerPie(nkill, nwound, novictims, markersize, clustersize) {
        let len = markersize;

        // Compute fractions
        let fractionWithoutVictims = novictims/(clustersize !== void 0 ? clustersize : 1);
        let fractionWithVictims = 1 - fractionWithoutVictims;
        let fractionKilled = (novictims & clustersize === void 0) ? 0 : nkill/(nkill+nwound);
        let fractionInjured = 1 - fractionKilled;

        // Compute ABSOLUTE angles
        let angleStart = 0;
        let angleKill  = 2*Math.PI*fractionWithVictims*fractionKilled;
        let angleWound = angleKill + 2*Math.PI*fractionWithVictims*fractionInjured;
        let angleNoHarm = 2*Math.PI;

        // The piechart svg reference
        let svg = d3.select(document.createElement("div"))
            .append("svg")
            .attr("width", len)
            .attr("height", len)
            .attr("class", "cluster_icon");
        svg.append("circle")
            .attr("r", len*2/5)
            .attr("cx", len/2)
            .attr("cy", len/2)
            .attr("fill", "#fff");
        // The killed part
        svg.append("path")
            .attr("d", d3.svg.arc()
                .innerRadius(len/3)
                .outerRadius(len/2)
                .startAngle(0)
                .endAngle(angleKill))
            .attr("fill", "#f00")
            .attr("transform", `translate(${len/2},${len/2})`);
        svg.append("path")
            .attr("d", d3.svg.arc()
                .innerRadius(len/3)
                .outerRadius(len/2)
                .startAngle(angleKill)
                // Going clockwise
                .endAngle(angleWound))
            .attr("fill", "#ffa500")
            .attr("transform", `translate(${len/2},${len/2})`);
        svg.append("path")
            .attr("d", d3.svg.arc()
                .innerRadius(len/3)
                .outerRadius(len/2)
                .startAngle(angleWound)
                .endAngle(angleNoHarm))
            .attr("fill", "#76b2e4")
            .attr("transform", `translate(${len/2},${len/2})`);

        if (clustersize !== void 0) {
            svg.append("text")
                .attr("x", len/2)
                .attr("y", len/2)
                .attr("dy", 4)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .text(clustersize);
        }

        return svg;
    }

    static markerSize(peopleInvolved) {
        return 24 + Math.sqrt(peopleInvolved/50);
    }

    refreshMarkers() {
        let t1 = new Date();

        // Enable and disable markers according to crossfilter
        let markers = this.pruneCluster.GetMarkers();
        markers.map(function(x) {x.filtered = true; return x;});
        let filteredEvents = xf.lat.bottom(Infinity);
        filteredEvents.map(x => x.marker.filtered = false);
        this.pruneCluster.ProcessView();

        // Log
        let t2 = new Date();
        console.log("Refreshed the data on the map:", t2-t1);
    }
}
