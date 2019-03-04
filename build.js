const mapshaper = require('mapshaper');
const fs = require('fs');
const path = require('path');

// Read in the configuration object from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Run a Mapshaper command and output the result
const runMapshaper = (commands, description) =>
  new Promise((resolve, reject) => {
    if (description) console.log(`${description}...`);
    mapshaper.runCommands(commands, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (description) console.log('Completed.');
        resolve(result);
      }
    });
  });

// Convert the ESRI shapefile for each state into GeoJSON
config.shapefiles.map(shapefile =>
  runMapshaper(
    `-i "${path.join(
      config.downloadDir,
      shapefile.state,
      shapefile.filename
    )}" -o format=geojson ${path.join(
      config.downloadDir,
      `${shapefile.state}.json`
    )}`
  ).catch(error => {
    console.log(`Error: ${error.message}`);
  })
);
