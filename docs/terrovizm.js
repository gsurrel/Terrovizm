// Commented out for prototyping in the browser's console
//"use strict"

let data = new Object();
let startTime = new Date();
let downloadTime;
let reformatTime;

function main() {
    d3.select("body")
        .append("h1")
        .text("Terrovizm");

    let dateString = "2017-11-24";
    console.log("Loading data", dateString);

    d3.json(`db-${dateString}.json`, function(error, json) {
        // Log
        if (error) return console.error(error);
        downloadTime = new Date();
        console.log("Download and parsing finished", `Time ${(downloadTime - startTime)/1000} seconds`);

        // Process data
        reformatData(json);

        // TODO: Load in crossbar
        
    });
}

function reformatData(json) {
    // We did not use a dictionnary for the events to save network space.
    // Let's recreate a nice data structure.

    // Split the columns names apart, then all the refs are fine
    let columns = json.refs.columns;
    delete json.refs.columns;
    data.refs = json.refs;

    // Create a placeholder object
    let eventKeys = Object.values(columns).filter(x => _.isString(x));

    // Fill-in the data object
    data.events = json.events.map(x => _.object(eventKeys, x));

    // Log
    reformatTime = new Date();
    console.log("Reformatting of data finished", `Time ${(reformatTime - downloadTime)/1000} seconds`);
}
