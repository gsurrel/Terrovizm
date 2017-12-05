"use strict"

class TerroMap {
    // References to UI objects
    //let map;

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
            mapT.refreshMarkers();
        });
        locationFilter.on("enabled", function () {
            console.log("Geofilter enabled");
        });
        locationFilter.on("disabled", function () {
            console.log("Geofilter disabled");
        });

        // Create and add the PruneCluster layer
        this.pruneCluster = new PruneClusterForLeaflet(100, 20);
        PruneCluster.Cluster.ENABLE_MARKERS_LIST = true
        this.pruneCluster.BuildLeafletClusterIcon = function(cluster) {
            let markers = cluster.GetClusterMarkers();
            let nkill = markers.reduce((acc, x) => acc + x.data.nkill, 0);
            let nwound = markers.reduce((acc, x) => acc + x.data.nwound, 0);
            let nocasualties = markers.reduce((acc, x) => acc + x.data.nkill == 0 & x.data.nwound == 0, 0);
            let iconSize = 24 + Math.sqrt(cluster.population/80);
            return new L.divIcon({
                html: TerroMap.createMarkerPie(nkill, nwound, iconSize, cluster.population, nocasualties).node().outerHTML,
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
        <h3>More…</h3>
        <a href="http://www.start.umd.edu/gtd/search/IncidentSummary.aspx?gtdid=${event.eventid}" target="_blank">Details</a>`
    }

    static createMarkerPie(nkill, nwound, markersize, clustersize, nocasualties) {
        let len = markersize;
        let svg = d3.select(document.createElement("div"))
        //let svg = d3.select("body")
            .append("svg")
            .attr("width", len)
            .attr("height", len);
        if(nkill + nwound != 0) {
            svg.append("path")
                .attr("d", d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(len/2)
                    .startAngle(0)
                    .endAngle(-nkill / (nwound + nkill) * Math.PI * 2 * (clustersize === void 0 ? 1 : (1-nocasualties/clustersize))))
                .attr("fill", "red")
                .attr("transform", `translate(${len/2},${len/2})`);
            svg.append("path")
                .attr("d", d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(len/2)
                    .startAngle(0)
                    .endAngle(nwound / (nwound + nkill) * Math.PI * 2 * (clustersize === void 0 ? 1 : (1-nocasualties/clustersize))))
                .attr("fill", "orange")
                .attr("transform", `translate(${len/2},${len/2})`);
        }
        let circle = svg.append("circle")
            .attr("r", len*2/5)
            .attr("cx", len/2)
            .attr("cy", len/2)
            .attr("fill", clustersize === void 0 ? "white" : "#ddd");
        if(nkill + nwound == 0) {
            circle.attr("stroke", "black");
        }
        if (clustersize !== void 0) {
            svg.append("text")
                .attr("x", len/2)
                .attr("y", len/2)
                .attr("dy", 5)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .text(clustersize);
        }

        return svg;
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
