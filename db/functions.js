const { Logger, truncate, convertDate } = require('../utils');
const { statuses } = require('../constants/statuses');
const chalk = require('chalk');

function insertFile(db, CID, name, fileSize, formattedSize, index) {
  db.run(
    `INSERT INTO CONTENT (CID,NAME,SIZE,SIZE_BYTES,STATUS,STATE,COPY_NUMBER,DATETIME_STARTED) VALUES ('${CID}','${name}','${formattedSize}','${fileSize}', 'queued', 'upload','${index}','00:00:00:00');`,
    [],
    err => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        Logger.info(`file details successfully added for ${name}`);
      }
    }
  );
}

function updateFile(db, name, { CID, dealID, minerID }, index) {
  db.run(
    `UPDATE CONTENT SET DEAL_ID='${dealID}', MINER_ID='${minerID}', STATUS='sync', DEAL_DATE=datetime(CURRENT_TIMESTAMP, 'localtime'), DATETIME_STARTED=datetime(CURRENT_TIMESTAMP, 'localtime') WHERE CID='${CID}' AND COPY_NUMBER='${index}';`,
    [],
    err => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
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
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        response.push(row);
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
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        queued = row['count(CID)'];
      }
    },
    function() {
      callback(queued);
    }
  );
}

function getQueuedFilesInfo(db, callback) {
  let queued;

  db.each(
    'SELECT sum(SIZE_BYTES), count(SIZE_BYTES) FROM CONTENT WHERE STATUS="queued"',
    (err, row) => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        queued = {
          count: row['count(SIZE_BYTES)'],
          size: row['sum(SIZE_BYTES)']
        };
      }
    },
    function() {
      callback(queued);
    }
  );
}

function getRetryFiles(db, callback) {
  let files = [];

  db.each(
    'SELECT COPY_NUMBER,CID,NAME FROM CONTENT WHERE STATUS="queued"',
    (err, row) => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        files.push([
          { copyNumber: row.COPY_NUMBER, cid: row.CID, name: row.NAME }
        ]);
      }
    },
    function() {
      callback(files);
    }
  );
}

function getActiveFileList(db, callback) {
  let active;
  db.each(
    'SELECT count(CID) FROM CONTENT WHERE NOT STATUS="queued"',
    (err, row) => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
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
        Logger.error('db error');
        Logger.error(err.stack);
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
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        const rowData = [
          row.ID.toString(),
          row.STATE,
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
        Logger.error('db error');
        Logger.error(err.stack);
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

function getFilteredTableContent(db, param, callback) {
  let data = [['jobId', 'type', 'status', 'content', 'size', 'elapsed time']];

  db.each(
    `SELECT ID,STATE,STATUS,NAME,SIZE,DATETIME_STARTED FROM CONTENT WHERE NAME LIKE '%${param}%' OR SIZE LIKE '%${param}%' OR ID LIKE '%${param}%' ORDER BY NAME DESC`,
    (err, row) => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        const rowData = [
          row.ID.toString(),
          row.STATE,
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

function getStorageDeals(db, callback) {
  let deals = [];

  db.each(
    'SELECT DEAL_ID,CID,COPY_NUMBER,COMMD_ORIGINAL FROM CONTENT WHERE DEAL_ID IS NOT NULL',
    (err, row) => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        deals.push({
          dealId: row.DEAL_ID,
          cid: row.CID,
          copyNumber: row.COPY_NUMBER,
          commD_old: row.COMMD_ORIGINAL
        });
      }
    },
    function() {
      callback(deals);
    }
  );
}

function updateFileStatus(
  db,
  cid,
  copyNumber,
  state,
  commD,
  commR,
  commRStar,
  fixityResult,
  init
) {
  let query;

  if (init) {
    query = `UPDATE CONTENT SET COMMD_ORIGINAL='${commD}', COMMR_ORIGINAL='${commR}', COMMRSTAR_ORIGINAL='${commRStar}', STATUS='${statuses[state]}', DATETIME_STARTED=datetime(CURRENT_TIMESTAMP, 'localtime') WHERE CID='${cid}' AND COPY_NUMBER='${copyNumber}';`;
  } else if (commD) {
    query = `UPDATE CONTENT SET COMMD_LATEST='${commD}', COMMR_LATEST='${commR}', COMMRSTAR_LATEST='${commRStar}', STATUS='${statuses[state]}', DATE_LAST_CHECK=datetime(CURRENT_TIMESTAMP, 'localtime'), VERIFY_RESULT='${fixityResult}' WHERE CID='${cid}' AND COPY_NUMBER='${copyNumber}';`;
  }

  db.run(query, [], err => {
    if (err) {
      Logger.error('db error');
      Logger.error(err.stack);
    } else {
      Logger.info(`file details successfully updated for ${cid}`);
    }
  });
}

function getVerifyList(db, callback) {
  let response = [];

  db.each(
    'SELECT CID,NAME,MINER_ID,DEAL_DATE,COMMD_ORIGINAL,COMMR_ORIGINAL,COMMRSTAR_ORIGINAL,COMMD_LATEST,COMMR_LATEST,COMMRSTAR_LATEST,DATE_LAST_CHECK,VERIFY_RESULT FROM CONTENT WHERE COMMD_LATEST IS NOT NULL',
    (err, row) => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        response.push(row);
      }
    },
    function() {
      callback(response);
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
  getTableDataNotQueued,
  getFilteredTableContent,
  getQueuedFilesInfo,
  getRetryFiles,
  getStorageDeals,
  updateFileStatus,
  getVerifyList
};
