const { Logger, truncate, convertDate } = require('../utils');
const { statuses } = require('../constants/statuses');
const chalk = require('chalk');

function insertFile(db, CID, name, fileSize, formattedSize) {
  db.run(
    `INSERT INTO CONTENT (CID,NAME,SIZE,SIZE_BYTES,STATUS,STATE,DATETIME_STARTED) VALUES ('${CID}','${name}','${formattedSize}','${fileSize}', 'queued', 'upload', '00:00:00:00');`,
    [],
    err => {
      if (err) {
        Logger.error('db error', err.stack);
      } else {
        Logger.info(`file details successfully added for ${name}`);
      }
    }
  );
}

function updateFile(
  db,
  name,
  { CID, dealID, minerID, state, signature },
  index
) {
  db.run(
    `UPDATE CONTENT SET DEAL_ID='${dealID}', MINER_ID='${minerID}', COMMP_ORIGINAL='${signature}', STATUS='${statuses[state]}', DEAL_DATE=datetime(CURRENT_TIMESTAMP, 'localtime'), NUMBER_OF_COPIES='${index}', DATETIME_STARTED=datetime(CURRENT_TIMESTAMP, 'localtime') WHERE CID='${CID}';`,
    [],
    err => {
      if (err) Logger.error('db error', err.stack);
      else {
        Logger.info(`file details successfully updated for ${name}`);
      }
    }
  );
}

function getStoredFileList(db, callback) {
  let response = [];

  db.each(
    'SELECT CID,SIZE,SIZE_BYTES,NAME,MINER_ID,DEAL_DATE FROM CONTENT WHERE MINER_ID IS NOT NULL',
    (err, row) => {
      if (err) {
        Logger.error('db error', err.stack);
      } else {
        response.push([row]);
      }
    },
    function() {
      callback(response);
    }
  );
}

function getQueuedFileList(db, callback) {
  let queued;
  db.each(
    'SELECT count(CID) FROM CONTENT WHERE STATUS="queued"',
    (err, row) => {
      if (err) {
        Logger.error('db error', err.stack);
      } else {
        queued = row['count(CID)'];
      }
    },
    function() {
      callback(queued);
    }
  );
}

function getActiveFileList(db, callback) {
  let active;
  db.each(
    'SELECT count(CID) FROM CONTENT WHERE NOT STATUS="queued"',
    (err, row) => {
      if (err) {
        Logger.error('db error', err.stack);
      } else {
        active = row['count(CID)'];
      }
    },
    function() {
      callback(active);
    }
  );
}

function getStorageSpace(db, callback) {
  let space;

  db.each(
    'SELECT sum(SIZE_BYTES) FROM CONTENT WHERE MINER_ID IS NOT NULL',
    (err, row) => {
      if (err) {
        console.log(err);
        Logger.error('db error', err.stack);
      } else {
        space = row['sum(SIZE_BYTES)'];
      }
    },
    function() {
      callback(space);
    }
  );
}

function getTableData(db, callback) {
  let data = [['jobId', 'type', 'status', 'content', 'size', 'elapsed time']];

  db.each(
    'SELECT ID,STATE,STATUS,NAME,SIZE,DATETIME_STARTED FROM CONTENT ORDER BY STATUS DESC',
    (err, row) => {
      if (err) {
        console.log(err);
        Logger.error('db error', err.stack);
      } else {
        const rowData = [
          row.ID.toString(),
          row.STATE || '1',
          row.STATUS,
          truncate(row.NAME, 30),
          row.SIZE,
          convertDate(row.DATETIME_STARTED)
        ];

        if (row.STATUS === 'queued') {
          data.push([
            chalk.hex('#979797')(row.ID.toString()),
            chalk.hex('#979797')(row.STATE),
            chalk.hex('#979797')(row.STATUS),
            chalk.hex('#979797')(truncate(row.NAME, 30)),
            chalk.hex('#979797')(row.SIZE),
            chalk.hex('#979797')(convertDate(row.DATETIME_STARTED))
          ]);
        } else {
          data.push(rowData);
        }
      }
    },
    function() {
      callback(data);
    }
  );
}

function getTableDataNotQueued(db, callback) {
  let data = [['jobId', 'type', 'status', 'content', 'size', 'elapsed time']];

  db.each(
    'SELECT ID,STATE,STATUS,NAME,SIZE,DATETIME_STARTED FROM CONTENT WHERE STATUS != "queued" ORDER BY STATUS DESC',
    (err, row) => {
      if (err) {
        console.log(err);
        Logger.error('db error', err.stack);
      } else {
        const rowData = [
          row.ID.toString(),
          row.STATE || '1',
          row.STATUS,
          truncate(row.NAME, 30),
          row.SIZE,
          convertDate(row.DATETIME_STARTED)
        ];

        data.push(rowData);
      }
    },
    function() {
      callback(data);
    }
  );
}

module.exports = {
  insertFile,
  updateFile,
  getStoredFileList,
  getStorageSpace,
  getQueuedFileList,
  getActiveFileList,
  getTableData,
  getTableDataNotQueued
};
