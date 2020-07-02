const chalk = require('chalk');
const { filter } = require('lodash');

const { connect, close, getQueuedFilesInfo, getRetryFiles } = require('../core/infrastructure/db');
const {
  Logger,
  formatBytes,
  progress,
  partialProgress,
  failedProgress
} = require('../utils');
const { getMiners, proposeDeal } = require('./store');

async function retry(fc) {
  try {
    const db = await connect();
    const miners = await getMiners(fc);
    let bar;

    getQueuedFilesInfo(db, data => {
      const { size, count } = data;
      bar = progress(count);

      console.clear();
      console.log(`🔍  Checking for failed jobs...`);
      console.log(`${chalk.hex('#A706E2')('==>')} ${count} files`);
      console.log(`${chalk.hex('#A706E2')('==>')} ${formatBytes(size)}`);
      console.log(`\n📡  making filecoin storage deals for the failed copies`);
      bar.tick(0);

      getRetryFiles(db, data => {
        retryDeals(fc, db, data, miners, bar);
      });
    });
  } catch (err) {
    console.log('cannot connect to database');
    Logger.error(err.stack);
  }
}

async function retryDeals(fc, db, files, miners, bar) {
  const count = files.length;

  const deals = await Promise.all(
    files.map(file => {
      const { cid, copyNumber, name } = file[0];

      return proposeDeal(fc, db, { cid, name }, miners, 0, copyNumber, bar);
    })
  );

  const accepted = filter(deals, { deal: 'accepted' }).length;

  if (accepted === count) {
    console.log('\n\n✅  all storage deals successfully made!');
    console.log(
      `${chalk.hex('#A706E2')(
        '==>'
      )} monitor progress with the "starling monitor" command\n`
    );
  } else if (accepted > 0 && accepted < count) {
    bar = partialProgress(count);
    bar.tick(accepted);

    console.log(
      `\n\n ⚠️ Only enough deals were made to store ${accepted} of the failed copies`
    );
    console.log(
      `${chalk.hex('#A706E2')(
        '==>'
      )} try increasing your $ per TB asking price\n`
    );
  } else if (!accepted) {
    bar = failedProgress();
    bar.tick(1);

    console.log('\n\n❌  No one accepted your storage proposals!');
    console.log(
      `${chalk.hex('#A706E2')(
        '==>'
      )} try increasing your $ per TB asking price\n`
    );
  }

  close(db);
}

module.exports = {
  retry
};
