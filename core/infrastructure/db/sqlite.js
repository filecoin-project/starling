const sqlite3 = require('sqlite3').verbose();
const fs = require('fs-extra');

const { dbSchema } = require('./schema');
const { Logger } = require('../../../utils');
const { dbPath } = require('../../../constants/paths');

let init = false;

async function connect() {
  try {
    await fs.open(dbPath, 'r');
  } catch (err) {
    init = true;
    await fs.writeFile(dbPath, '', { flag: 'w' });
  }

  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => {
    if (err) {
      throw new Error('error establishing a database connection');
    }
    Logger.info('Connected to the database.');
    Logger.info(db);
    if (init) {
      db.exec(dbSchema, err => {
        if (err) {
          fs.unlink(dbPath);
          throw new Error(err);
        }
      });
    }
  });

  return db;
}

async function close(db) {
  db.close(err => {
    if (err) {
      throw new Error('error closing the database connection');
    }
    Logger.info('Closed the database connection.');
  });
}

module.exports = {
  connect,
  close
};
