    "use strict"

    class TerroMap {
        // References to UI objects
        constructor() {
            let _this = this; // Used when implementing event listenenrs

            this.map = L.map('map').setView([0, 0], 2);
            this.map.options.minZoom = 2;
            this.map.options.maxBounds = L.latLngBounds(
                L.latLng(100, -200),
                 L.latLng(-100, 200));

            L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
                attribution: 'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            // Add the map filtering
            this.locationFilter = new L.LocationFilter().addTo(this.map);
            this.locationFilter.on("change", function (e) {
                xf.lat.filter([e.bounds.getSouth(), e.bounds.getNorth()]);
                xf.lon.filter([e.bounds.getWest(), e.bounds.getEast()]);
                refreshView();
            });
            this.locationFilter.on("enabled", function () {
                let bounds = _this.locationFilter.getBounds();
                xf.lat.filter([bounds.getSouth(), bounds.getNorth()]);
                xf.lon.filter([bounds.getWest(), bounds.getEast()]);
                refreshView();
            });
            this.locationFilter.on("disabled", function () {
                xf.lat.filter(null);
                xf.lon.filter(null);
                refreshView();
            });

            // Create heatmap layer
            let cfgHeatMap = {
                // radius should be small ONLY if scaleRadius is true (or small radius is intended)
                // if scaleRadius is false it will be the constant radius used in pixels
                "radius": 16,
                "maxOpacity": .8,
                // scales the radius based on map zoom
                "scaleRadius": false,
                // if set to false the heatmap uses the global maximum for colorization
                // if activated: uses the data maximum within the current map boundaries
                //   (there will always be a red spot with useLocalExtremas true)
                "useLocalExtrema": true,
                // which field name in your data represents the latitude - default "lat"
                latField: ((x) => x.position.lat),
                // which field name in your data represents the longitude - default "lng"
                lngField: ((x) => x.position.lng),
                // which field name in your data represents the data value - default "value"
                valueField: ((x) => (!x.filtered) * (x.data.nkill*2+x.data.nwound)),
                gradient: {
                    // enter n keys between 0 and 1 here for gradient color customization
                    '.1': 'blue',
                    '.5': 'orange',
                    '.90': 'red',
                    '.98': '#FCC'
                },
            };
            this.heatmapLayer = new HeatmapOverlay(cfgHeatMap);
            this.map.addLayer(this.heatmapLayer);

            // Create and add the PruneCluster layer
            this.pruneCluster = new PruneClusterForLeaflet(100, 20);
            PruneCluster.Cluster.ENABLE_MARKERS_LIST = true

            // Custom cluster icon
            this.pruneCluster.BuildLeafletClusterIcon = function(cluster) {
                let markers = cluster.GetClusterMarkers();
                let nkill = markers.reduce((acc, x) => acc + x.data.nkill, 0);
                let nwound = markers.reduce((acc, x) => acc + x.data.nwound, 0);
                let novictims = markers.reduce((acc, x) => acc + ((x.data.nkill + x.data.nwound) == 0), 0);
                let iconSize = TerroMap.markerSize(nkill+nwound);
                if(mapT.map.getZoom()<=12 && (nkill+nwound) > 500) return new L.divIcon({html: "<span class='cluster_icon'/>", className: "killwoundmarker"});
                return new L.divIcon({
                    html: TerroMap.createMarkerPie(nkill, nwound, novictims, iconSize, cluster.population).node().outerHTML,
                    iconAnchor: [iconSize/2, iconSize/2],
                    className: "killwoundmarker"
                });
            };

            // Custom cluster behavior (for adding the mouseover mpopup)
            _this.pruneCluster.defaultBuildLeafletCluster = _this.pruneCluster.BuildLeafletCluster;
            this.pruneCluster.BuildLeafletCluster = function(cluster, position) {
                let markers = cluster.GetClusterMarkers();
                let nkill = markers.reduce((acc, x) => acc + x.data.nkill, 0);
                let nwound = markers.reduce((acc, x) => acc + x.data.nwound, 0);
                let novictims = markers.reduce((acc, x) => acc + ((x.data.nkill + x.data.nwound) == 0), 0);
                if(mapT.map.getZoom()<=12 && (nkill+nwound) > 500) return new L.Marker(position, {icon: new L.divIcon({html: "<span class='cluster_icon'/>", className: "killwoundmarker"})});
                let m = _this.pruneCluster.defaultBuildLeafletCluster(cluster, position);
                m.on('mouseover', function() {
                    let popup = L.popup()
                        .setLatLng(cluster.averagePosition)
                        .setContent(`<h2>Zone of ${markers.length} attacks</h2>
                            <h3>Victims</h3>
                            <ul>
                                <li class='killed'>Killed: ${nkill}</li>
                                <li class='wounded'>Wounded: ${nwound}</li>
                            </ul>`);
                    popup.openOn(_this.map);
                });
                m.on('mouseout', function() {
                    _this.map.closePopup();
                });

                return m;
            };

            this.map.addLayer(this.pruneCluster);
        }

        static createrMarkerText(event) {
            return `<h2>${(new Date(event.date)).toDateString()}</h2>
            <h3>Victims</h3>
            <ul>
                <li class='killed'>Killed: ${event.nkill}</li>
                <li class='wounded'>Wounded: ${event.nwound}</li>
                <li>Suicide: ${event.suicide ? "yes" : "no"}</li>
            </ul>
            <h3>Target(s)</h3>
            <ul>
                ${event.targtype.reduce((acc, y) => acc+`<li>${y}</li>`, "")}
            </ul>
            <h3>Weapons(s)</h3>
            <ul>
                ${event.weaptype.reduce((acc, y) => acc+`<li>${y}</li>`, "")}
            </ul>
            <h3><a href="http://www.start.umd.edu/gtd/search/IncidentSummary.aspx?gtdid=${event.eventid}" target="_blank">More…</a></h3>`;
        }

        static createMarkerPie(nkill, nwound, novictims, markersize, clustersize) {
            let len = markersize*.8;

            // Compute fractions
            let fractionKilled = 0;
            let fractionInjured = 0;
            if(nkill+nwound != 0) {
                fractionKilled = nkill/(nkill+nwound);
                fractionInjured = 1 - fractionKilled;
            }

            // Compute ABSOLUTE angles
            let angleStart = 0;
            let angleKill  = 2*Math.PI*fractionKilled;
            let angleWound = angleKill + 2*Math.PI*fractionInjured;
            let angleNoHarm = 2*Math.PI;

            // The piechart svg reference
            let svg = d3.select(document.createElement("div"))
                .append("svg")
                .attr("width", markersize)
                .attr("height", markersize)
                .attr("class", "cluster_icon");
            if(clustersize === void 0) {
                svg.append("circle")
                .attr("r", len*2/5)
                .attr("cx", markersize/2)
                .attr("cy", markersize/2)
                .attr("fill", "#888");
            } else {
                svg.append("path")
                    .attr("d", d3.svg.arc()
                        .innerRadius((4*len)/(3*6))
                        .outerRadius((11*len)/(3*6))
                        .startAngle(0)
                        .endAngle(2*Math.PI))
                    .attr("fill", "#fff")
                    .attr("transform", `translate(${markersize/2},${markersize/2})`);
            }
            // The killed part
            svg.append("path")
                .attr("d", d3.svg.arc()
                    .innerRadius(len/3)
                    .outerRadius(len/2)
                    .startAngle(0)
                    .endAngle(angleKill))
                .attr("fill", "#f00")
                .attr("transform", `translate(${markersize/2},${markersize/2})`);
            // The wounded part
            svg.append("path")
                .attr("d", d3.svg.arc()
                    .innerRadius(len/3)
                    .outerRadius(len/2)
                    .startAngle(angleKill)
                    // Going clockwise
                    .endAngle(angleWound))
                .attr("fill", "#ffa500")
                .attr("transform", `translate(${markersize/2},${markersize/2})`);
            // The no-victims part
            svg.append("path")
                .attr("d", d3.svg.arc()
                    .innerRadius(len/3)
                    .outerRadius(len/2)
                    .startAngle(angleWound)
                    .endAngle(angleNoHarm))
                .attr("fill", "#76b2e4")
                .attr("transform", `translate(${markersize/2},${markersize/2})`);

            if (false && clustersize !== void 0) {
                svg.append("text")
                    .attr("x", markersize/2)
                    .attr("y", markersize/2)
                    .attr("dy", 4)
                    .attr("text-anchor", "middle")
                    .attr("fill", "black")
                    .text(clustersize);
            }

            return svg;
        }

        static markerSize(peopleInvolved) {
            return 24 + Math.sqrt(peopleInvolved);
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
