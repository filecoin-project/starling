const { Logger, truncate, convertDate } = require('../../../utils');
const { StorageDealStatus } = require('../../domain/model/StorageDeal');

async function insertFile(db, uuid, CID, name, fileSize, formattedSize, index, isEncrypted, originalName) {
  const date = new Date();

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO CONTENT (CID,UUID,NAME,SIZE,SIZE_BYTES,STATUS,STATE,COPY_NUMBER,DATETIME_STARTED,ENCRYPTED,ORIGINAL_NAME) VALUES ('${CID}','${uuid}','${name}','${formattedSize}','${fileSize}', 'IMPORTED', 'upload','${index}', '${date.toISOString()}', '${isEncrypted}', '${originalName}');`,
      [],
      err => {
        if (err) {
          reject(err);
        } else {
          resolve();
          Logger.info(`file details successfully added for ${name}`);
        }
      }
    );
  })
}

async function updateFile(db, name, { CID, dealID, minerID }, index) {
  return new Promise((resolve, reject) => {
    const date = new Date();
    db.run(
      `UPDATE CONTENT SET DEAL_ID='${dealID}', MINER_ID='${minerID}', DEAL_DATE='${date.toISOString()}' WHERE CID='${CID}' AND COPY_NUMBER='${index}';`,
      [],
      err => {
        if (err) {
          reject(err);
          Logger.error(err.stack);
        } else {
          resolve();
          Logger.info(`file details successfully updated for ${name}`);
        }
      }
    );
  });
}

async function getFilesByCid(db, cid) {
  return new Promise((resolve) => {
    let response = [];

    db.each(
      `SELECT UUID,CID,SIZE,SIZE_BYTES,NAME,MINER_ID,DEAL_DATE, COPY_NUMBER FROM CONTENT WHERE CID='${cid}'`,
      (err, row) => {
        if (err) {
          Logger.error('db error');
          Logger.error(err.stack);
        } else {
          response.push(row);
        }
      },
      function() {
        resolve(response);
      }
    );
  });
}

function getStoredFileList(db) {
  return new Promise((resolve, reject) => {
    let response = [];

    db.each(
      'SELECT UUID,CID,SIZE,SIZE_BYTES,NAME,ORIGINAL_NAME,MINER_ID,DEAL_DATE,ENCRYPTED,COPY_NUMBER,STATUS,DATETIME_STARTED FROM CONTENT WHERE MINER_ID IS NOT NULL',
      (err, row) => {
        if (err) {
          reject(err);
          Logger.error(err.stack);
        } else {
          response.push(row);
        }
      },
      function() {
        resolve(response);
      }
    );
  });
}

function getQueuedFileListCount(db) {
  return new Promise((resolve, reject) => {
    let queued;

    db.each(
      'SELECT count(CID) FROM CONTENT WHERE STATUS="queued"',
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          queued = row['count(CID)'];
        }
      },
      function() {
        resolve(queued);
      }
    );
  });
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

function getActiveFileListCount(db) {
  return new Promise((resolve, reject) => {
    let active;

    db.each(
      'SELECT count(CID) FROM CONTENT WHERE NOT STATUS="queued"',
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          active = row['count(CID)'];
        }
      },
      function() {
        resolve(active);
      }
    );
  });
}

function getActiveFileList(db) {
  return new Promise((resolve, reject) => {
    const active = [];
    db.each(
      'SELECT UUID,CID,NAME,SIZE,MINER_ID,DEAL_DATE,DEAL_ID,VERIFY_RESULT,STATE,STATUS,COPY_NUMBER,DATETIME_STARTED FROM CONTENT WHERE NOT STATUS="queued"',
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          active.push(row);
        }
      },
      function() {
        resolve(active);
      }
    );
  });
}

function getStorageSpace(db) {
  return new Promise((resolve, reject) => {
    let space;

    db.each(
      'SELECT sum(SIZE_BYTES) FROM CONTENT WHERE MINER_ID IS NOT NULL',
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          space = row['sum(SIZE_BYTES)'];
        }
      },
      function() {
        resolve(space);
      }
    );
  });
}

function getRetrievalFileInfo(db, uuid, copyNumber, callback) {
  let info = [];

  db.each(
    `SELECT CID,NAME,DEAL_ID,ENCRYPTED,MINER_ID,ORIGINAL_NAME FROM CONTENT WHERE UUID='${uuid}' AND COPY_NUMBER=${copyNumber}`,
    (err, row) => {
      if (err) {
        Logger.error('db error');
        Logger.error(err.stack);
      } else {
        info.push(row);
      }
    },
    function() {
      callback(info);
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

function getStorageDeals(db) {
  return new Promise((resolve, reject) => {
    let deals = [];

    db.each(
      'SELECT DEAL_ID,CID,COPY_NUMBER,COMMD_ORIGINAL FROM CONTENT WHERE DEAL_ID IS NOT NULL',
      (err, row) => {
        if (err) {
          reject(err);
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
        resolve(deals);
      }
    );
  })
}

async function updateFileStatus(
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
  const status = StorageDealStatus.fromIdx(state);

  if (init) {
    query = `UPDATE CONTENT SET COMMD_ORIGINAL='${commD}', COMMR_ORIGINAL='${commR}', COMMRSTAR_ORIGINAL='${commRStar}', STATUS='${status}' WHERE CID='${cid}' AND COPY_NUMBER='${copyNumber}';`;
  } else if (commD) {
    query = `UPDATE CONTENT SET COMMD_LATEST='${commD}', COMMR_LATEST='${commR}', COMMRSTAR_LATEST='${commRStar}', STATUS='${status}', DATE_LAST_CHECK=datetime(CURRENT_TIMESTAMP, 'localtime'), VERIFY_RESULT='${fixityResult}' WHERE CID='${cid}' AND COPY_NUMBER='${copyNumber}';`;
  }

  return new Promise((resolve, reject) => {
    db.run(query, [], err => {
      if (err) {
        reject(err);
        Logger.error(err);
      } else {
        resolve();
        Logger.info(`file details successfully updated for ${cid}`);
      }
    });
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

function getSortedTableContent(db, param, callback) {
  let data = [['jobId', 'type', 'status', 'content', 'size', 'elapsed time']];

  db.each(
    `SELECT ID,STATE,STATUS,NAME,SIZE,SIZE_BYTES,DATETIME_STARTED FROM CONTENT ORDER BY ${param} DESC`,
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

function getJobStatus(db, id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT STATE,NAME,SIZE,DATETIME_STARTED,STATUS FROM CONTENT WHERE DEAL_ID='${id}'`,
      (err, row) => {
        if (err) {
          Logger.error(err.stack);
          reject(err);
        } else {
          resolve(row);
        }
      },
    );
  });
}

function getCompleteFileList(db) {
  return new Promise((resolve, reject) => {
    let response = [];

    db.each(
      'SELECT UUID,CID,SIZE,SIZE_BYTES,NAME,ORIGINAL_NAME,MINER_ID,DEAL_DATE,ENCRYPTED,COPY_NUMBER,STATUS,DATETIME_STARTED FROM CONTENT',
      (err, row) => {
        if (err) {
          reject(err);
          Logger.error(err.stack);
        } else {
          response.push(row);
        }
      },
      function() {
        resolve(response);
      }
    );
  });
}

module.exports = {
  insertFile,
  updateFile,
  getStoredFileList,
  getStorageSpace,
  getQueuedFileListCount,
  getActiveFileListCount,
  getActiveFileList,
  getFilteredTableContent,
  getQueuedFilesInfo,
  getRetryFiles,
  getStorageDeals,
  updateFileStatus,
  getVerifyList,
  getSortedTableContent,
  getRetrievalFileInfo,
  getFilesByCid,
  getJobStatus,
  getCompleteFileList
};
