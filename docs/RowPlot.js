"use strict"

var rowPlots = {};

class RowPlot{
    constructor(id, dimension, cap, title){
        this.dimension = dimension;
        this.group = dimension.group();
        this.id = id;
        this.cap = cap;
        this.title = title;

        //create the placeholder div for the plot
        this.placeholder = d3.select("#row-plots")
            .append("div")
            .attr("id", id);

        // set the width to the one of the placeholder
        this.width = this.placeholder.node().getBoundingClientRect()['width'];
        // compute the height depending on the number of bars in the plot
        this.height = Math.min(this.group.size(), this.cap) * 20 + 60;

        // Append header with the title of the rowplot
        this.placeholder.append('span')
            .attr('class','row-plot-title')
            .html(this.title + " ");

        // Create the reset functionality for the plot. This is mostly taken care of by dc.js library
        this.placeholder.append('a')
            .attr('class','reset')
            .attr('href',`javascript:rowPlots["${id}"].plot.filterAll();dc.renderAll();`)
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

function createRowPlots(){
    console.log("Creating the row plots");
    let startTime = new Date();

    let regionDim = xf.dimension(d => data.refs.region[d.region]);
    rowPlots['region-row-plot'] = new RowPlot("region-row-plot", regionDim, Infinity, "Attacks by region");

    let countryDim = xf.dimension(d => data.refs.country[d.country]);
    rowPlots['country-row-plot'] = new RowPlot("country-row-plot", countryDim, 10, "Attacks by country");

    let gnameDim = xf.dimension(d => d.gname, true);
    rowPlots['gname-row-plot'] = new RowPlot("gname-row-plot", gnameDim, 15, "Terrorist group");

    let attackTypeDim = xf.dimension(d => data.refs.attacktype[d.attacktype], true);
    rowPlots['attacktype-row-plot'] = new RowPlot("attacktype-row-plot", attackTypeDim, 10, "Type of attacks");

    let targTypeDim = xf.dimension(d => d.targtype.map(targ => data.refs.targtype[targ]));
    rowPlots['targtype-row-plot'] = new RowPlot("targtype-row-plot", targTypeDim, 10, "Type of target");

    let weapTypeDim = xf.dimension(d => data.refs.weaptype[d.weaptype],true);
    rowPlots['weaptype-row-plot'] = new RowPlot("weaptype-row-plot", weapTypeDim, 10, "Type of weapon");

    let suicideDim = xf.dimension(d => d.suicide == 1 ? "Yes":"No");
    rowPlots['suicide-row-plot'] = new RowPlot("suicide-row-plot", suicideDim, Infinity, "Suicide attacks");

    dc.renderAll();
    console.log(`Took ${new Date() - startTime} ms`);
}
