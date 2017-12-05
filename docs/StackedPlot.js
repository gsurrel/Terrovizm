"use strict"

class StackedPlot{
    constructor(rangeDimension, title){
        let startTime = new Date();

        this.rangeDimension = rangeDimension;
        this.rangeGroup = rangeDimension.group();

        let maxDate = new Date(this.rangeDimension.top(1)[0]['date']),
            minDate = new Date(this.rangeDimension.bottom(2)[0]['date']);

        this.title = title;

        // create the placeholder div fot the actual plot
        this.placeholder = d3.select("#stacked-plot");

        this.width = this.placeholder.node().getBoundingClientRect()['width'];
        this.stackedPlotHeight = this.placeholder.node().getBoundingClientRect()['height'];
        this.rangeHeight = d3.select("#range-plot").node().getBoundingClientRect()['height'];

        this.rangeChart = dc.barChart("#range-plot");
        this.rangeChart.width(this.width)
            .height(this.rangeHeight)
            .margins({top: 0, right: 50, bottom: 20, left: 50})
            .dimension(this.rangeDimension)
            .group(this.rangeGroup)
            .centerBar(true)
            .gap(1)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .round(d3.time.month.round)
            .alwaysUseRounding(true)
            .xUnits(d3.time.months)
            .elasticY(true)
            .yAxis().ticks(3);

        // this.chart = dc.lineChart("#stacked-plot");
        // this.chart
        //     .renderArea(true)
        //     .width(this.width)
        //     .height(this.stackedPlotHeight)
        //     .transitionDuration(500)
        //     .margins({top: 30, right: 50, bottom: 25, left: 50})
        //     .dimension(this.rangeDimension)
        //     .mouseZoomable(true)
        //
        //     .rangeChart(this.rangeChart)
        //     .x(d3.time.scale().domain([new Date(1970, 0, 1), new Date(2016, 11, 31)]))
        //     .round(d3.time.month.round)
        //     .xUnits(d3.time.years)
        //     .elasticY(true)
        //     .renderHorizontalGridLines(true)
        //
        //     .group(this.religionDimension, 'Legend')
        //     .valueAccessor(d => d.value);

        console.log(`Finished stacked plot creation in ${new Date() - startTime} ms`);
    }
}

function createStackedPlots(){
    let attacksMonths = xf.dimension(d => d.date);
    new StackedPlot(attacksMonths,"title");
    dc.renderAll();
}