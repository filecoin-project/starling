const { Logger } = require('../utils');

function insertFile(db, CID, name, size) {
  db.run(
    `INSERT INTO CONTENT (CID,NAME,SIZE,STATUS) VALUES ('${CID}','${name}','${size}', 'queued');`,
    [],
    err => {
      if (err) {
        Logger.error('db error', err);
      } else {
        Logger.info(`file details successfully added for ${name}`);
      }
    }
  );
}

function updateFile(db, name, { CID, dealID, minerID, state, signature }) {
  db.run(
    `UPDATE CONTENT SET DEAL_ID='${dealID}', MINER_ID='${minerID}', STATE='${state}', COMMP_ORIGINAL='${signature}', STATUS='uploading', DEAL_DATE=CURRENT_TIMESTAMP WHERE CID='${CID}';`,
    [],
    err => {
      if (err) Logger.error('db error', err);
      else {
        Logger.info(`file details successfully updated for ${name}`);
      }
    }
  );
}

module.exports = {
  insertFile,
  updateFile
};
