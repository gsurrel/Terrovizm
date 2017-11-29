class RowPlot{
    constructor(id, dimension, cap, title){
        this.dimension = dimension;
        this.group = dimension.group();
        this.id = id;
        this.cap = cap;
        this.title = title;

        this.placeholder = d3.select("#row-plots")
            .append("div")
            .attr("id", id);

        this.width = this.placeholder.node().getBoundingClientRect()['width'];
        this.height = Math.min(this.group.size(), this.cap) * 20 + 60;

        // Append header with the title of the rowplot
        this.placeholder.append('h3')
            .attr('class','row-plot-title')
            .html(this.title);

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

        this.plot.on('renderlet', chart =>
            // rotate x-axis labels
            chart.selectAll('g.tick text')
                .attr('transform', 'translate(15,10) rotate(45)'));
    }
}

function createRowPlots(){
    console.log("Creating the row plots");
    let startTime = new Date();

    let rowPlots = [];

    let regionDim = xf.dimension(d => data.refs.region[d.region]);
    rowPlots.push(new RowPlot("region-row-plot", regionDim, Infinity, "Attacks by region"));

    let countryDim = xf.dimension(d => data.refs.country[d.country]);
    rowPlots.push(new RowPlot("country-row-plot", countryDim, 10, "Attacks by country"));

    let gnameDim = xf.dimension(d => d.gname, true);
    rowPlots.push(new RowPlot("gname-row-plot", gnameDim, 15, "Terrorist group"));

    let attackTypeDim = xf.dimension(d => data.refs.attacktype[d.attacktype], true);
    rowPlots.push(new RowPlot("attacktype-row-plot", attackTypeDim, 10, "Type of attacks"));

    let targTypeDim = xf.dimension(d => d.targtype.map(targ => data.refs.targtype[targ]));
    rowPlots.push(new RowPlot("targtype-row-plot", targTypeDim, 10, "Type of target"));

    let weapTypeDim = xf.dimension(d => data.refs.weaptype[d.weaptype],true);
    rowPlots.push(new RowPlot("weaptype-row-plot", weapTypeDim, 10, "Type of weapon"));

    let suicideDim = xf.dimension(d => d.suicide == 1 ? "Yes":"No");
    rowPlots.push(new RowPlot("suicide-row-plot", suicideDim, Infinity, "Suicide attacks"));

    dc.renderAll();
}
