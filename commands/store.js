const fs = require('fs-extra');
const path = require('path');
const { sortBy, size, filter } = require('lodash');
const chalk = require('chalk');

const {
  Logger,
  progress,
  readConfig,
  partialProgress,
  failedProgress
} = require('../utils');
const { updateFile, insertFile, connect, close } = require('../db');
const { checkConfig } = require('../utils');
const { dealTime } = require('../constants/deals');
const { formatBytes } = require('../utils');

async function getInfo(arg) {
  const stats = await fs.stat(arg);

  const fileSize = stats.size;
  const name = path.basename(arg);

  if (stats.isFile()) {
    return Promise.resolve({ status: 'file', name: name, fileSize: fileSize });
  } else if (stats.isDirectory()) {
    return Promise.resolve({
      status: 'directory',
      name: name,
      fileSize: fileSize
    });
  }
}

async function checkFileDirectory() {
  try {
    const argLength = process.argv.length;
    const arg = process.argv[3];

    if (argLength !== 4) {
      return Promise.reject('please provide 1 argument (file or directory)');
    }

    return await getInfo(arg);
  } catch (err) {
    return Promise.reject('no such file or directory');
  }
}

async function importFile(fc, file, { name, fileSize }) {
  const cid = await fc.client.import(file);

  return [{ cid: cid, fileSize: fileSize, name: name }];
}

async function importFiles(fc, { status, name, fileSize }) {
  const arg = process.argv[3];
  const formattedSize = formatBytes(fileSize);

  if (status === 'file') {
    console.log(`🔍  Indexing file...`);
    console.log(`${chalk.hex('#A706E2')('==>')} ${formattedSize}`);
    return await importFile(fc, arg, { name: name, fileSize: fileSize });
  } else if (status === 'directory') {
    Logger.info(`\nThis is directory ${name} of size ${formattedSize}`);

    const files = await fs.readdir(arg);
    const allFilesInfo = await Promise.all(
      files.map(file => getInfo(`${arg}/${file}`))
    );

    console.log(`🔍  Indexing folder...`);
    console.log(`${chalk.hex('#A706E2')('==>')} ${allFilesInfo.length} files`);
    console.log(`${chalk.hex('#A706E2')('==>')} ${formattedSize}`);

    return await Promise.all(
      files.map((file, index) =>
        importFile(fc, `${arg}/${file}`, allFilesInfo[index])
      )
    );
  }
}

async function getMiners(fc) {
  const list = [];

  for await (let item of fc.client.listAsks()) {
    list.push(item);
  }

  return sortBy(list, ['price']);
}

function updateFileDB(db, name, deal, index) {
  updateFile(db, name, deal, index);
}

async function proposeDeal(
  fc,
  db,
  { cid, name },
  miners,
  index,
  copyNumber,
  bar
) {
  for (let i = 0; i < size(miners); i++) {
    Logger.info(`storing ${name} with miner ${miners[i].miner}`);

    try {
      const storageDealProposal = await fc.client.proposeStorageDeal(
        miners[i].miner,
        cid,
        miners[i].id,
        dealTime,
        { allowDuplicates: true }
      );

      const deal = {
        dealID: storageDealProposal.proposalCid,
        minerID: miners[i].miner,
        signature: storageDealProposal.signature,
        state: storageDealProposal.state,
        CID: cid
      };

      Logger.info(storageDealProposal);
      if (copyNumber) {
        bar.tick();
      }

      updateFileDB(db, name, deal, copyNumber ? copyNumber : index + 1);

      return Promise.resolve({ deal: 'accepted' });
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        break;
      }
      Logger.error(err.stack);
      continue;
    }
  }
}

async function ProposeDeals(fc, db, config, importedFiles, miners) {
  const filesCount = importedFiles.length;
  const totalCopies = parseInt(config.copies, 10) || 3; // defaults to 3 in case someone manually edits the config file
  let bar = progress(totalCopies);
  let acceptedDeals = [];

  bar.tick(0);

  for (let i = 0; i < totalCopies; i++) {
    const deals = await Promise.all(
      importedFiles.map(file => {
        const FILE = filesCount === 1 ? file : file[0];
        const { cid, name, fileSize } = FILE;
        const formattedSize = formatBytes(fileSize);

        if (i === 0) {
          for (let j = 0; j < totalCopies; j++) {
            insertFile(db, cid, name, fileSize, formattedSize, j + 1);
          }
        }

        return proposeDeal(fc, db, FILE, miners, i);
      })
    );

    const accepted = filter(deals, { deal: 'accepted' }).length;

    if (accepted === filesCount) {
      bar.tick();
      acceptedDeals[i] = { deal: 'full' };
    } else if (accepted > 0) {
      acceptedDeals[i] = { deal: 'partial' };
    } else {
      acceptedDeals[i] = { deal: 'failed' };
    }
  }

  const full = filter(acceptedDeals, { deal: 'full' }).length;
  const partial = filter(acceptedDeals, { deal: 'partial' }).length;
  const failed = filter(acceptedDeals, { deal: 'failed' }).length;

  if (full === totalCopies) {
    console.log('\n\n✅  all storage deals successfully made!');
    console.log(
      `${chalk.hex('#A706E2')(
        '==>'
      )} monitor progress with the "starling monitor" command\n`
    );
  } else if (partial > 0 && full > 0) {
    bar = partialProgress(totalCopies);
    bar.tick(full);

    console.log(
      `\n\n ⚠️ Only enough deals were made to store ${full} complete copies`
    );
    console.log(
      `${chalk.hex('#A706E2')(
        '==>'
      )} try increasing your $ per TB asking price\n`
    );
  } else if (full === 0 && partial > 0) {
    bar = partialProgress(totalCopies);
    bar.tick(partial);

    console.log(
      `\n\n ⚠️ only enough deals were made to store some of your files`
    );
    console.log(
      `${chalk.hex('#A706E2')(
        '==>'
      )} try increasing your $ per TB asking price\n`
    );
  } else if (failed === totalCopies) {
    bar = failedProgress();
    bar.tick(1);

    console.log('\n\n❌  No one accepted your storage proposals!');
    console.log(
      `${chalk.hex('#A706E2')(
        '==>'
      )} try increasing your $ per TB asking price\n`
    );
  }
}

async function store(fc) {
  try {
    const argInfo = await checkFileDirectory(fc);
    const db = await connect();
    await checkConfig();
    const config = await readConfig();

    const miners = await getMiners(fc);
    console.clear();

    const importedFiles = await importFiles(fc, argInfo);

    Logger.info(`\nIMPORTED FILES:`);
    Logger.info(importedFiles);

    console.log(
      `\n📡  making filecoin storage deals for ${config.copies} redundant copies`
    );

    await ProposeDeals(fc, db, config, importedFiles, miners);

    close(db);
  } catch (err) {
    console.log('error storing files');
    Logger.error(err.stack);
  }
}

module.exports = {
  store,
  getMiners,
  proposeDeal
};
