// Import libraries
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');

// Read in the configuration object from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Recursively create directories - code based on https://github.com/thejoshwolfe/yauzl/blob/master/examples/unzip.js
const mkdirp = (dir, cb) => {
  if (dir === '.') return cb();
  fs.stat(dir, err => {
    if (err == null) return cb(); // already exists

    var parent = path.dirname(dir);
    mkdirp(parent, () => {
      fs.mkdir(dir, cb);
    });
  });
};

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
    })
    // Now extract the contents of the zip
    .then(() => {
      yauzl.open(
        path.join(config.downloadDir, download.state, download.zipFile),
        { lazyEntries: true },
        (err, zipfile) => {
          if (err) throw err;
          zipfile.readEntry();
          zipfile.on('entry', entry => {
            const entryPath = path.join(
              config.downloadDir,
              download.state,
              entry.fileName
            );

            if (/\/$/.test(entry.fileName)) {
              // Directory file names end with '/'.
              mkdirp(entryPath, () => {
                if (err) throw err;
                zipfile.readEntry();
              });
            } else {
              // ensure parent directory exists
              mkdirp(path.dirname(entryPath), () => {
                zipfile.openReadStream(entry, (err, readStream) => {
                  if (err) throw err;
                  readStream.on('end', () => {
                    zipfile.readEntry();
                  });
                  const writeStream = fs.createWriteStream(entryPath);
                  readStream.pipe(writeStream);
                });
              });
            }
          });
        }
      );
    });
});
