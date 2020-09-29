const chalk = require('chalk');
const ProgressBar = require('progress');
const figlet = require('figlet');
const { StarlingCore } = require('../core');
const { readConfig } = require('../utils');
const { checkConfig } = require('../utils');
const { Logger } = require('../core/infrastructure/log');

async function checkArgs() {
  try {
    const argLength = process.argv.length;

    if (argLength !== 4) {
      return Promise.reject('Please provide 1 argument (file or directory)');
    }

  } catch (err) {
    return Promise.reject('no such file or directory');
  }
}

async function store() {
  try {
    console.log(figlet.textSync('Starling CLI', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    }));

    await checkArgs();
    const pathName = process.argv[3];

    await checkConfig();
    const config = await readConfig();
    const basePrice = config.price;
    const noOfCopies = parseInt(config.copies);
    const encryptionKey = config.encryptionKey;
    const core = new StarlingCore();

    console.log('\nSummary:');
    console.log('----------------------');
    console.log(`file: ${chalk.yellow(pathName)}`);
    console.log(`encryption: ${chalk.yellow(encryptionKey ? 'enabled' : 'disabled')}`);
    console.log(`copies: ${chalk.yellow(noOfCopies)}`);

    console.log(`\n🍿 Storing file...\n`);

    const progressBar = new ProgressBar('[:bar] :percent :state', {
      complete: '\u001b[43m \u001b[0m',
      incomplete: ' ',
      width: 80,
      total: 70,
      renderThrottle: 0,
    });
    progressBar.tick(10, {
      state: '\t 🚀 Setting up...',
    });
    core.on('ERROR', error => {
      Logger.info(error);
      let message = '';
      if (!error) {
        message = '\t🚫 Error occured';
      } else if (error.message) {
        message = `\t🚫 Error: ${error.message}`;
      } else {
        message = `\t🚫 Error: ${error}`;
      }
      progressBar.tick(10, {
        state: message,
      });
      process.exit(0);
    });

    core.on('STORE_FIND_MINERS_STARTED', () => {
      progressBar.tick(20 - progressBar.curr, {
        state: '\t🔍 Finding miners',
      });
    });

    core.on('STORE_ENCRYPTION_STARTED', () => {
      progressBar.tick(30 - progressBar.curr, {
        state: '\t🔑 Encrypting file',
      });
    });

    core.on('STORE_FILE_SPLIT_STARTED', () => {
      progressBar.tick(40 - progressBar.curr, {
        state: '\t🔪 Splitting file',
      });
    });

    core.on('STORE_IMPORT_STARTED', () => {
      progressBar.tick(50 - progressBar.curr, {
        state: '\t📁 Importing file',
      });
    });

    core.on('STORE_DEALS_STARTED', () => {
      progressBar.tick(60 - progressBar.curr, {
        state: '\t💰 Making deals with miners',
      });
    });

    core.on('STORE_DONE', () => {
      progressBar.tick(70 - progressBar.curr, {
        state: '\t✅ Storage deals done!',
      });
      console.log(`\nYou can track the status of storage deals using ${chalk.yellow('starling monitor')} command.\n`);
      process.exit(0);
    });

    await core.store(pathName, basePrice, noOfCopies, encryptionKey);

  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  store,
};
