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
  console.log('Converting downloaded shapefiles to GeoJSON');

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

    return runMapshaper(
      `-i combine-files ${inputs} -merge-layers -o ${path.join(
        config.downloadDir,
        `${config.baseFileName}-p100-alldivisions.json`
      )}`,
      'Combining state and territory GeoJSON files'
    );
  })
  .then(() => {
    // Convert the GeoJSON file to TopoJSON
    return runMapshaper(
      `-i download/${
        config.baseFileName
      }-p100-alldivisions.json -o topojson/ format=topojson`,
      'Converting GeoJSON file to TopoJSON'
    );
  })
  .then(() => {
    // Create TopoJSON versions of the full map with different simplification levels
    console.log(
      '\nCreating simplified (smaller) versions of the full TopoJSON file:'
    );
    return Promise.all(
      config.simplifyPercentages.map(percentage =>
        runMapshaper(
          `-i topojson/${
            config.baseFileName
          }-p100-alldivisions.json -simplify weighted percentage=${percentage}% -o topojson/${
            config.baseFileName
          }-p${percentage}-alldivisions.json format=topojson`,
          `Simplify retaining ${percentage} of removable points`
        )
      )
    );
  })
  .then(() => {
    // Create single-division map files at each simplification level
    console.log(
      '\nCreating single-division map files at each simplification level:'
    );
    return Promise.all(
      config.simplifyPercentages.map(percentage => {
        console.log(`Maps at ${percentage}% simplification level...`);
        return Promise.all(
          config.divisions.map(division =>
            runMapshaper(
              `-i topojson/${
                config.baseFileName
              }-p${percentage}-alldivisions.json -filter 'Elect_div === "${
                division.name
              }"' -o topojson/${config.baseFileName}-p${percentage}-${
                division.filename
              }.json`
            )
          )
        );
      })
    );
  })
  .then(() => {
    // Get an array of the filenames in the topojson directory
    console.log('\nGetting list of TopoJSON files...');
    return new Promise((resolve, reject) => {
      fs.readdir('topojson', (error, files) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      });
    });
  })
  .then(files => {
    console.log('Converting TopoJSON files to GeoJSON...');
    // Convert all TopoJSON files to GeoJSON
    return Promise.all(
      files.map(file =>
        runMapshaper(`-i topojson/${file} -o geojson/${file} format=geojson`)
      )
    );
  })
  .catch(error => {
    console.log(`Error: ${error.message}`);
  });
