const fs = require('fs-extra');
const path = require('path');
const { sortBy, size, filter } = require('lodash');
const chalk = require('chalk');

const { Logger, progress } = require('../utils');
const { updateFile, insertFile, connect, close } = require('../db');
const { checkConfig } = require('./checkConfig');
const { dealTime } = require('../constants/deals');

async function getInfo(arg) {
  const stats = await fs.stat(arg);

  const fileSizeInBytes = stats.size;
  const sizeInMB = fileSizeInBytes / 1000000.0;
  const name = path.basename(arg);

  if (stats.isFile()) {
    return Promise.resolve({ status: 'file', name: name, sizeInMB: sizeInMB });
  } else if (stats.isDirectory()) {
    return Promise.resolve({
      status: 'directory',
      name: name,
      sizeInMB: sizeInMB
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

async function importFile(fc, file, { name, sizeInMB }) {
  const cid = await fc.client.import(file);

  return { cid: cid, sizeInMB: sizeInMB, name: name };
}

async function importFiles(fc, { status, name, sizeInMB }) {
  const arg = process.argv[3];

  if (status === 'file') {
    console.log(`🔍  Indexing file...`);
    console.log(`${chalk.magenta('==>')} ${sizeInMB} MB`);
    return await importFile(fc, arg, { name: name, sizeInMB: sizeInMB });
  } else if (status === 'directory') {
    Logger.info(`\nThis is directory ${name} of size ${sizeInMB}MB`);

    const files = await fs.readdir(arg);
    const allFilesInfo = await Promise.all(
      files.map(file => getInfo(`${arg}/${file}`))
    );

    console.log(`🔍  Indexing folder...`);
    console.log(`${chalk.magenta('==>')} ${allFilesInfo.length} files`);
    console.log(`${chalk.magenta('==>')} ${sizeInMB} MB`);

    return await Promise.all(
      files.map((file, index) =>
        importFile(fc, `${arg}/${file}`, allFilesInfo[index])
      )
    );
  }
}

async function ListAsks(fc) {
  const list = [];

  for await (let item of fc.client.listAsks()) {
    list.push(item);
  }

  return sortBy(list, ['price']);
}

function updateFileDB(db, name, deal) {
  updateFile(db, name, deal);
}

async function proposeDeal(fc, db, { cid, sizeInMB, name }, miners, bar) {
  insertFile(db, cid, name, sizeInMB);

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

      bar.tick();
      Logger.info(deal);
      updateFileDB(db, name, deal);

      return Promise.resolve({ deal: 'accepted' });
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        break;
      }
      Logger.error(err);
      continue;
    }
  }
}

async function ProposeDeals(fc, db, importedFiles, miners) {
  if (Array.isArray(importedFiles)) {
    const length = importedFiles.length;
    const bar = progress(length);
    bar.tick(0);

    const deals = await Promise.all(
      importedFiles.map(file => {
        return proposeDeal(fc, db, file, miners, bar);
      })
    );

    const filtered = filter(deals, { deal: 'accepted' }).length;

    if (filtered === length) {
      console.log('\n\n✅  all storage deals successfully made!');
      console.log(
        `${chalk.magenta(
          '==>'
        )} monitor progress with the "starling monitor" command\n`
      );
    } else if (filtered === 0) {
      console.log('\n\n❌  No one accepted your storage proposals!');
      console.log(
        `${chalk.magenta('==>')} try increasing your $ per TB asking price\n`
      );
    } else {
      console.log(
        '\n\n⚠️  Only enough deals were made to store one complete copy'
      );
      console.log(
        `${chalk.magenta('==>')} try increasing your $ per TB asking price\n`
      );
    }
  } else {
    const bar = progress(1);
    bar.tick(0);

    return await proposeDeal(fc, db, importedFiles, miners, bar);
  }
}

async function store(fc) {
  try {
    const argInfo = await checkFileDirectory(fc);
    const db = await connect();
    await checkConfig();

    const importedFiles = await importFiles(fc, argInfo);

    Logger.info(`\nIMPORTED FILES:`);
    Logger.info(importedFiles);

    const miners = await ListAsks(fc);

    console.log(`\n📡  making filecoin storage deals for 3 redundant copies`);

    await ProposeDeals(fc, db, importedFiles, miners);

    close(db);
  } catch (err) {
    if (err.message) {
      Logger.error(err.message);
    }
    Logger.error(err);
  }
}

module.exports = {
  store
};
