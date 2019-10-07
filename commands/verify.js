const { connect, close, getVerifyList } = require('../db');
const { Logger, generateCSV } = require('../utils');

async function verify() {
  try {
    const db = await connect();
    getVerifyList(db, data => {
      generateCSV(data, 'verify');
    });

    close(db);
  } catch (err) {
    console.log('cannot connect to database');
    Logger.error(err.stack);
  }
}

module.exports = {
  verify
};
