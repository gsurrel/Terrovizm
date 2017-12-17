"use strict"

let rowPlots = {};

class RowPlot{
    constructor(id, cap, title, dimension){
        this.dimension = dimension;
        this.group = dimension.group();
        this.id = id;
        this.cap = cap;
        this.title = title;

        //create the placeholder div for the plot
        this.placeholder = d3.select("#row-plots")
            .append("div")
            .attr("id", id)
            .attr("data-close", true)
            .on("click", function(d){
                this.dataset.close = !(this.dataset.close == 'true');
            });

        // set the width to the one of the placeholder
        this.width = this.placeholder.node().getBoundingClientRect()['width'];
        // compute the height depending on the number of bars in the plot
        this.height = Math.min(this.group.size(), this.cap) * 20 + 60;

        // Append header with the title of the rowplot
        this.placeholder.append('span')
            .attr('class','row-plot-title')
            .html(this.title + " ");

        // Create the reset functionality for the plot. This is mostly taken care of by dc.js library
        this.placeholder.append('span')
            .attr('class','reset')
            .attr('onclick',`javascript:rowPlots["${id}"].plot.filterAll();dc.renderAll();`)
            .attr('style','visibility:hidden')
            .html('reset');

        // config the actual rowplot
        this.plot = dc.rowChart(`#${id}`);
        this.plot.renderLabel(true)
            .height(this.height)
            .width(this.width)
            .cap(this.cap)
            .dimension(this.dimension)
            .group(this.group)
            .ordinalColors(['#3182bd'])
            .elasticX(true)
            .xAxis().ticks(4);

        this.plot.turnOnControls(true);
        this.plot.controlsUseVisibility(true);

        // rotate the x-ticks labels so that they do not overlap
        this.plot.on('renderlet', chart =>
            // rotate x-axis labels
            chart.selectAll('g.tick text')
                .attr('transform', 'translate(15,10) rotate(45)'));

    }
}

function createRowPlots(plotsConf){
    let startTime = new Date();

    let midTime = new Date();
    console.log(`Created dimensions`, midTime - startTime);

    // Create plots
    rowPlots = plotsConf.map(x => new RowPlot(...x[1]));

    let endTime = new Date();
    console.log(`Created plots`, endTime - midTime);

    dc.renderAll();
    console.log(`Rendered all DC plots`, new Date() - endTime);
}
