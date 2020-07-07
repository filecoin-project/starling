const { Logger, generateCSV } = require('../utils');
const { StarlingCore } = require('../core');
const figlet = require('figlet');
const chalk = require('chalk');

async function list() {
  try {
    console.log(figlet.textSync('Starling CLI', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    }));
    console.log('\n');

    const core = new StarlingCore();
    core.on('ERROR', error => {
      if (!error) {
        console.log(`\n🚫 Error occured`);
      } else if (error.message) {
        console.log(`\n🚫 Error: ${error.message}`);
      } else {
        console.log(`\n🚫 Error: ${error}`);
      }
    });
    const { jobs } = await core.getListReport();
    console.table(jobs.slice(0, 10));

    console.log(`\n🍿 Generating file...`);
    const path = await generateCSV(jobs, 'list');
    console.log(`\n✅ Successfully generated csv file`);
    console.log(`=> Path: ${chalk.yellow(path)}\n`);
  } catch (err) {
    console.log('cannot connect to database');
    Logger.error(err.stack);
  }
}

module.exports = {
  list
};
