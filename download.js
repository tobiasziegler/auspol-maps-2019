// Import libraries
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Read in the configuration object from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Check for download directory and create it if needed
if (!fs.existsSync(config.downloadDir)) {
  fs.mkdirSync(config.downloadDir);
}

config.downloads.map(download => {
  fetch(`${config.baseUrl}${download.zipFile}`)
    // Save the downloaded zip file
    .then(response => {
      return new Promise((resolve, reject) => {
        const stateDir = path.join(config.downloadDir, download.state);

        // Check for state's download subdirectory and create it if needed
        if (!fs.existsSync(stateDir)) {
          fs.mkdirSync(stateDir);
        }

        const dest = fs.createWriteStream(
          path.join(stateDir, download.zipFile)
        );
        response.body.pipe(dest);
        response.body.on('error', err => {
          reject(err);
        });
        dest.on('finish', () => {
          resolve();
        });
        dest.on('error', err => {
          reject(err);
        });
      });
    });
});
