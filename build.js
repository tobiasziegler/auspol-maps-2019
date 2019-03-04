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
const convertDownloads = () => {
  return Promise.all(
    config.downloads.map(download =>
      runMapshaper(
        `-i "${path.join(
          config.downloadDir,
          download.state,
          download.shapefile
        )}" -o format=geojson ${path.join(
          config.downloadDir,
          `${download.state}.json`
        )}`
      )
    )
  );
};

convertDownloads()
  .then(() => {
    // Combine the state and territory GeoJSON files into a national file
    const inputs = config.downloads
      .map(download => path.join(config.downloadDir, `${download.state}.json`))
      .join(' ');

    runMapshaper(
      `-i combine-files ${inputs} -merge-layers -o ${path.join(
        config.downloadDir,
        'australia.json'
      )}`
    );
  })
  .catch(error => {
    console.log(`Error: ${error.message}`);
  });
