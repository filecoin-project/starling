const { connect, close, getRetrievalFileInfo } = require('../db');
const { Logger } = require('../utils');
const fs = require('fs-extra');
const splitFile = require('split-file');

async function get(fc, minerID, uuid) {
  try {
    const db = await connect();
    console.clear();

    await getRetrievalFileInfo(db, uuid, async data => {
      const numberOfFiles = data.length;
      let files = [];

      await data.map(async (file, index) => {
        const { CID, NAME } = file;
        files.push(NAME);

        console.log(`downloading ${NAME}`);
        Logger.info(`started downloading ${NAME}`);

        const pieceData = fc.retrievalClient.retrievePiece(minerID, CID);

        let data = Buffer.alloc(0);

        for await (const chunk of pieceData) {
          data = Buffer.concat([data, chunk]);
        }

        fs.writeFile(NAME, data, err => {
          if (err) {
            console.log(`error downloading ${NAME}`);
            Logger.error(err.stack);
          }
          console.log(`${NAME} saved successfully!`);
          Logger.info(`${NAME} saved successfully!`);
        });

        if (numberOfFiles > 1 && index === numberOfFiles - 1) {
          const fileName = NAME.split(/\.(?=[^.]+$)/)[0];
          splitFile
            .mergeFiles(files, __dirname + fileName)
            .then(() => {
              console.log(`${NAME} successfully downloaded`);
            })
            .catch(err => {
              console.log(`error merging ${NAME}`);
              Logger.error(err.stack);
            });
        }
      });
    });

    close(db);
  } catch (err) {
    console.log(err);
    Logger.error(err.stack);
  }
}

module.exports = {
  get
};
