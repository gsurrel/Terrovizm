"use strict"

// Performance timers
let startTime;
let downloadTime;
let reformatTime;
let transmissionTime;
let data = {};

onmessage = function(e) {
    console.log("Loading data", e.data.dateString);
    startTime = new Date();

    importScripts(...e.data.imports);

    d3.json(`db-${e.data.dateString}.json`, function(error, json) {
        // Log
        if (error) return console.error(error);
        downloadTime = new Date();
        console.log("Download and parsing finished", downloadTime - startTime);

        // Process data
        reformatData(json);

        // Kill worker to free memory
        close();
    });
}

function reformatData(json) {
    // We did not use a dictionnary for the events to save network space.
    // Let's recreate a nice data structure.

    // Split the columns names apart, then all the refs are fine
    let columns = json.refs.columns;
    delete json.refs.columns;
    data.refs = json.refs;

    // Set unknown days and months to 1st day and month
    json.events.map(function(x) {
        x[columns.date].filter(y => y == 0).map(y => y = 1);
        x[columns.date][1]--; // Months start at 0 and not 1
        return x;
    });

    // Create the date in the iyear field, which we rename
    json.events.map(function(x) {
        x[columns.date] = Date.UTC(...x[columns.date]);
        return x;
    });

    // Transform data from unlabled array to an object
    let eventKeys = Object.keys(columns);
    data.events = json.events.map(x => _.object(eventKeys, x));

    // Create the Leaflet markers once and for all
    data.events.map(function(x) {
        x["marker"] = [
            x.latitude,
            x.longitude,
            {
                "nkill": x.nkill,
                "nwound": x.nwound,
                "icon": (() => undefined),
                "popup": (() => undefined)
            }];
        return x;
    });

    // Log processing time
    reformatTime = new Date();
    console.log("Reformatting of data finished", reformatTime - downloadTime);

    // Log transmission time
    postMessage(JSON.stringify(data));
    transmissionTime = new Date();
    console.log("Transmitting data to main thread finished", transmissionTime - reformatTime);
}
