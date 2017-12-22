"use strict"

let rangeChart;

class RangeChart{
    constructor(rangeDimension, title){
        let startTime = new Date();

        this.rangeDimension = rangeDimension;
        this.rangeGroup = rangeDimension.group(d3.time.month).reduceSum(v => v.nkill+v.nwound);

        let maxDate = new Date(this.rangeDimension.top(1)[0]['date']),
            minDate = new Date(this.rangeDimension.bottom(2)[0]['date']);

        this.title = title;

        // create the placeholder div fot the actual plot
        this.placeholder = d3.select("#range-plot");

        this.width = this.placeholder.node().getBoundingClientRect()['width'];
        this.rangeHeight = this.placeholder.node().getBoundingClientRect()['height'];

        this.rangeChart = dc.barChart("#range-plot");
        this.rangeChart
            .width(this.width)
            .height(this.rangeHeight)
            .margins({top: 0, right: 50, bottom: 20, left: 50})
            .dimension(this.rangeDimension)
            .group(this.rangeGroup)
            .centerBar(true)
            .gap(0)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .round(d3.time.month.round)
            .alwaysUseRounding(true)
            .xUnits(d3.time.months)
            .elasticY(true)
            .yAxis()
            .ticks(3);

        console.log('Finished range plot creation', new Date() - startTime);
    }
}

function createRangePlot(){
    dc.dateFormat = d3.time.format("%Y-%m-%d");
    let attacksMonths = xf.dimension(d => new Date(d.date));
    rangeChart = new RangeChart(attacksMonths, "title");
    dc.renderAll();
}
