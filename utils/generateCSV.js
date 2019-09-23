const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { csvPath } = require('../constants/paths');
const { Logger } = require('./logger');

async function generateCSV(list) {
  try {
    const path = process.argv[3]
      ? `${process.argv[3]}/starlingList.csv`
      : csvPath;

    const csvWriter = createCsvWriter({
      path: path,
      header: [
        { id: 'NAME', title: 'Content' },
        { id: 'SIZE', title: 'Size' },
        { id: 'SIZE_BYTES', title: 'Size(Bytes)' },
        { id: 'CID', title: 'CID' },
        { id: 'MINER_ID', title: 'Miner ID' },
        { id: 'DEAL_DATE', title: 'Deal commencement' }
      ]
    });

    await csvWriter.writeRecords(list);
    console.log(`generated csv file at ${path}`);
  } catch (err) {
    Logger.error(err.stack);
    if (err.code === 'ENOENT') {
      console.log('\nplease provide a valid directory');
    } else {
      console.log('could not generate the csv file');
    }
  }
}

module.exports = {
  generateCSV
};
