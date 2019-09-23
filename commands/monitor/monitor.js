const blessed = require('blessed');

const chalk = require('chalk');

const { Logger, formatBytes } = require('../../utils');
const {
  connect,
  getStorageSpace,
  getStoredFileList,
  getQueuedFileList,
  getActiveFileList,
  getTableData,
  getTableDataNotQueued
} = require('../../db');
const { getMiners } = require('../store');
const {
  getHeaderRight,
  getHeaderLeft,
  getTable,
  getFooter
} = require('./components');

function draw(param) {
  let bar = '';

  for (let i = 0; i < param; i++) {
    bar = bar + '|';
  }

  return bar;
}

function progress({ queued, active }) {
  const progressBarLength = 32;

  const percent = parseInt((active / (queued + active)) * 100, 10);
  const percentActive = parseInt((percent / 100) * 32, 10);

  const drawActive = draw(percentActive);
  const drawQueued = draw(progressBarLength - percentActive);

  return `${chalk.white(drawActive)}${chalk.hex('#424242')(
    drawQueued
  )} ${chalk.white(`${percent}%`)}`;
}

async function getMonitorData(fc, db) {
  let space, files, queued, active, tableData;

  getStorageSpace(db, data => {
    space = data;
  });
  getStoredFileList(db, data => {
    files = data;
  });
  getQueuedFileList(db, data => {
    queued = data;
  });
  getActiveFileList(db, data => {
    active = data;
  });
  getTableData(db, data => {
    tableData = data;
  });

  const miners = await getMiners(fc);
  const walletAddress = (await fc.address.ls())[0];
  const walletBalance = await fc.wallet.balance(walletAddress);

  const headerLeftData = [
    ``,
    `Files stored in the network: ${chalk.hex('#A706E2')(files.length)}`,
    `# of miners: ${chalk.hex('#A706E2')(miners.length)}`,
    `Storage space used: ${chalk.hex('#A706E2')(
      `${formatBytes(space) || '0 Bytes'}`
    )}`,
    `Wallet balance: ${chalk.hex('#A706E2')(`$fil ${walletBalance}`)}`
  ];

  const headerRightData = [
    '',
    `Active jobs: ${chalk.hex('#00E900')(active)}`,
    `Queued jobs: ${chalk.hex('#00E900')(queued)}`,
    ``,
    `${progress({ active, queued })}`
  ];

  const footerData = [[`${chalk.white.bgBlack(' ^H ')} hide queued`]];

  return {
    headerLeftData,
    headerRightData,
    tableData,
    footerData
  };
}

async function monitor(fc, rate) {
  try {
    const screen = blessed.screen({
      smartCSR: true
    });

    let index = 1;
    let paused = false;
    const footerShowQueued = [[`${chalk.white.bgBlack(' ^H ')} show queued`]];

    const refreshRate = rate * 1000 || 3000;
    const db = await connect();

    const {
      headerRightData,
      headerLeftData,
      tableData,
      footerData
    } = await getMonitorData(fc, db);

    const headerRight = getHeaderRight(headerRightData);
    const headerLeft = getHeaderLeft(headerLeftData);
    const table = getTable(tableData);
    const footer = getFooter(footerData);

    screen.append(headerLeft);
    screen.append(headerRight);
    screen.append(table);
    screen.append(footer);

    console.log(tableData.length);

    console.clear();
    screen.render();

    screen.on('keypress', (ch, key) => {
      switch (key.full) {
        case 'up':
          table.up();
          if (index !== 1) {
            index--;
          }
          break;
        case 'down':
          table.down();
          if (index < tableData.length) {
            index++;
          }
          break;
        case 'backspace':
          if (paused) {
            getTableData(db, data => {
              paused = false;
              table.setData(data);
              footer.setData(footerData);
              screen.render();
            });
          } else {
            getTableDataNotQueued(db, data => {
              paused = true;
              table.setData(data);
              footer.setData(footerShowQueued);
              screen.render();
            });
          }
          break;
        case 'C-f':
          break;
        case 'C-s':
          break;
        case 'escape':
        case 'q':
        case 'C-c':
          return process.exit(0);
      }

      screen.render();
    });

    setInterval(async () => {
      const {
        headerRightData,
        headerLeftData,
        tableData
      } = await getMonitorData(fc, db);

      if (!paused) {
        headerRight.setItems(headerRightData);
        headerLeft.setItems(headerLeftData);
        table.setData(tableData);
        table.select(index);
        screen.render();
      } else {
        index = 1;
      }
    }, refreshRate);
  } catch (err) {
    Logger.error(err.stack);
    process.exit(0);
  }
}

module.exports = {
  monitor
};
