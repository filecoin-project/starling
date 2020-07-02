const splitFile = require('split-file');
const chalk = require('chalk');
const figlet = require('figlet');
const ProgressBar = require('progress');
const { StarlingCore } = require('../core');
const { readConfig } = require('../utils');
const { checkConfig } = require('../utils');

async function checkArgs() {
  try {
    const argLength = process.argv.length;

    if (argLength < 5) {
      return Promise.reject('Please provide at least 2 arguments file uuid and path to store the file (within ipfs root). You can specify the copy number as well, otherwise we will retrieve any available copy of the file.');
    }
    //check path and uuid
  } catch (err) {
    return Promise.reject('unexpected error');
  }
}

async function get() {
  try {
    console.log(figlet.textSync('Starling CLI', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    }));

    const parsedArgs = [];
    let verbose = false;
    for (i = 3; i < process.argv.length; i++){
      if (process.argv[i] === 'debug') {
        verbose = true;
      } else {
        parsedArgs.push(process.argv[i]);
      }
    }

    if (parsedArgs.length < 2) {
      return Promise.reject('Please provide at least 2 arguments file uuid and path to store the file (within ipfs root). You can specify the copy number as well, otherwise we will retrieve any available copy of the file.');
    }

    //check path and uu
    const uuid = parsedArgs[0];
    const path = parsedArgs[1];
    const copyNumber = parsedArgs[2];
    await checkConfig();
    const config = await readConfig();
    const core = new StarlingCore();
    const encryptionKey = config.encryptionKey;
    let numberOfPieces = 1;
    let downloadedPieces = 0;

    console.log('\nSummary:');
    console.log('----------------------');
    console.log(`file id: ${chalk.yellow(uuid)}`);
    console.log(`encryption: ${chalk.yellow(encryptionKey ? 'enabled' : 'disabled')}`);

    const progressBar = new ProgressBar('[:bar] :percent :state', {
      complete: '\u001b[43m \u001b[0m',
      incomplete: ' ',
      width: 80,
      total: 100,
    });
    progressBar.tick(10, {
      state: '\t 🚀 Setting up...',
    });

    core.on('ERROR', error => {
      progressBar.tick(10, {
        state: `\n🚫 Error: ${error}`,
      });
    });

    core.on('ERROR_PIECE', error => {
      progressBar.tick(10, {
        state: `\n🚫 Error: ${error}`,
      });
    });

    core.on('DOWNLOAD_START', data => {
      progressBar.tick(20 - progressBar.curr, {
        state: `\t Started downloading: ${chalk.yellow(data.fileName)}`,
      });
      numberOfPieces = data.numberOfPieces;
    });

    core.on('DOWNLOAD_START_PIECE', fileName => {
      if (verbose){
        console.log(`Started downloading: ${chalk.yellow(fileName)}`);
      }
    });

    core.on('DOWNLOAD_FAIL', fileName => {
      console.log(`Failed to download ${chalk.yellow(fileName)}`);
    });

    core.on('DOWNLOAD_FAIL_PIECE', fileName => {
      if (verbose) {
        console.log(`Failed to download ${chalk.yellow(fileName)}`);
      } else {
        console.log(`Failed to download.`);
      }
    });

    core.on('DECRYPT_START', fileName => {
      progressBar.tick(90 - progressBar.curr, {
        state: `\t Decrypt file`,
      });
    });

    core.on('DOWNLOAD_SUCCESS', fileName => {
      progressBar.tick(100 - progressBar.curr, {
        state: `\t Successfully downloaded ${chalk.yellow(fileName)}`,
      });
    });

    core.on('DOWNLOAD_SUCCESS_PIECE', fileName => {
      if (numberOfPieces>1){
        downloadedPieces ++;
        if (verbose){
          console.log(`Successfully downloaded ${chalk.yellow(fileName)}`);
        } else {
          const progress = 20 + downloadedPieces*(60/numberOfPieces) - progressBar.curr;
          progressBar.tick(progress, {
            state: `\t Download progress: ${downloadedPieces}/${numberOfPieces}`,
          });
        }
      }
    });

    core.on('DOWNLOAD_MERGE_ERROR', fileName => {
      console.log(`Failed to download, merge failed ${chalk.yellow(fileName)}`);
    });

    await core.get(uuid, path, copyNumber, encryptionKey);

  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  get
};
