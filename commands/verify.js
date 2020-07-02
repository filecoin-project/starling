const { generateCSV } = require('../utils');
const { StarlingCore } = require('../core');
const figlet = require('figlet');
const chalk  = require('chalk');

async function verify() {
  console.log(figlet.textSync('Starling CLI', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  }));
  console.log('\n');

  const core  = new StarlingCore();
  core.on('ERROR', error => {
    let message = '';
    if (!error) {
      message = '\t🚫 Error occured';
    } else if (error.message) {
      message = `\t🚫 Error: ${error.message}`;
    } else {
      message = `\t🚫 Error: ${error}`;
    }
    console.log(message);
    process.exit(0);
  });

  const data = await core.verify();
  console.table(data);

  console.log(`\n🍿 Generating file...`);
  const path = await generateCSV(data, 'verify');
  console.log(`\n✅ Successfully generated csv file`);
  console.log(`=> Path: ${chalk.yellow(path)}\n`);
  process.exit(0);
}

module.exports = {
  verify
};
