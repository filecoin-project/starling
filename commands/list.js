const { connect, close, getStoredFileList } = require('../db');
const { Logger, generateCSV } = require('../utils');

async function list() {
  try {
    const db = await connect();
    getStoredFileList(db, data => {
      generateCSV(data);
    });

    close(db);
  } catch (err) {
    console.log('cannot connect to database');
    Logger.error(err.stack);
  }
}

module.exports = {
  list
};
