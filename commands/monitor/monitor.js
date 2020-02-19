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
  getTableDataNotQueued,
  getFilteredTableContent,
  getStorageDeals,
  updateFileStatus,
  getSortedTableContent
} = require('../../db');
const { getMiners } = require('../store');
const {
  getHeaderRight,
  getHeaderLeft,
  getTable,
  getFooter,
  getInput
} = require('./components');
const { sortValues } = require('../../constants/sortValues');

const regex = new RegExp('^[ -~]*$');
const footerData = [
  [
    `${chalk.white.bgBlack(' ^F ')} Filter ${chalk.white.bgBlack(
      ' ^H '
    )} hide queued ${chalk.white.bgBlack(
      ' ^S '
    )} sort by size ${chalk.white.bgBlack(
      ' ^T '
    )} sort by type ${chalk.white.bgBlack(' ^V ')} sort by content`
  ]
];

const footerShowQueued = [
  [
    `${chalk.white.bgBlack(' ^F ')} Filter ${chalk.white.bgBlack(
      ' ^H '
    )} show queued`
  ]
];

const footerExitFilter = [
  [
    `${chalk.white.bgBlack(' esc ')} exit filter ${chalk.white.bgBlack(
      ' ^H '
    )} show queued`
  ]
];

const footerSortData = [
  [
    `${chalk.white.bgBlack(' ^Q ')} exit sort ${chalk.white.bgBlack(
      ' ^S '
    )} sort by size ${chalk.white.bgBlack(
      ' ^T '
    )} sort by type ${chalk.white.bgBlack(' ^V ')} sort by content`
  ]
];

function draw(param) {
  let bar = '';

  for (let i = 0; i < param; i++) {
    bar = bar + '|';
  }

  return bar;
}

function progress({ queued, active }) {
  const progressBarLength = 32;

  const percent =
    active === 0 ? active : parseInt((active / (queued + active)) * 100, 10);
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
    `Files stored in the network: ${chalk.hex('#A706E2')(files.length || '')}`,
    `# of miners: ${chalk.hex('#A706E2')(miners.length)}`,
    `Storage space used: ${chalk.hex('#A706E2')(
      `${space ? formatBytes(space) : '0 Bytes'}`
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

  return {
    headerLeftData,
    headerRightData,
    tableData
  };
}

async function monitor(fc, rate) {
  try {
    const screen = blessed.screen({
      smartCSR: true
    });

    let index = 1;
    let monitoringPaused = false;
    let sortState = false;

    const refreshRate = rate * 1000 || 3000;
    const db = await connect();

    const { headerRightData, headerLeftData, tableData } = await getMonitorData(
      fc,
      db
    );

    const headerRight = getHeaderRight(headerRightData);
    const headerLeft = getHeaderLeft(headerLeftData);
    const table = getTable(tableData);
    const footer = getFooter(footerData);
    const input = getInput();

    screen.append(headerLeft);
    screen.append(headerRight);
    screen.append(table);
    screen.append(footer);
    screen.append(input);

    console.clear();
    screen.render();
    let userInput = '';

    input.on(['keypress'], (data, key) => {
      switch (key.full) {
        case 'backspace':
          userInput = userInput.slice(0, -1);
          getFilteredTableContent(db, userInput, data => {
            table.setData(data);
            screen.render();
          });
          break;

        case 'escape':
          input.clearValue();
          footer.setData(footerData);
          screen.render();
          userInput = '';
          monitoringPaused = false;
          break;

        case 'enter':
          break;

        default:
          if (data && regex.test(data)) {
            userInput = userInput + data;
          }

          getFilteredTableContent(db, userInput, data => {
            table.setData(data);
            screen.render();
          });

          break;
      }
    });

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
          if (monitoringPaused && !sortState) {
            getTableData(db, data => {
              monitoringPaused = false;
              table.setData(data.data);
              footer.setData(footerData);
              screen.render();
            });
          } else if (!sortState) {
            break;
          } else {
            getTableDataNotQueued(db, data => {
              monitoringPaused = true;
              table.setData(data);
              footer.setData(footerShowQueued);
              screen.render();
            });
          }
          break;
        case 'C-s':
        case 'C-t':
        case 'C-v':
          monitoringPaused = true;
          sortState = true;

          getSortedTableContent(db, sortValues[key.full], data => {
            table.setData(data);
            footer.setData(footerSortData);
            screen.render();
          });
          break;
        case 'C-q':
          sortState = false;
          monitoringPaused = false;
          index = 1;

          footer.setData(footerData);
          screen.render();
          break;
        case 'C-f':
          userInput = '';
          monitoringPaused = true;
          if (!sortState) {
            footer.setData(footerExitFilter);
            screen.render();
            input.focus();
          }

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

      if (!monitoringPaused) {
        headerRight.setItems(headerRightData);
        headerLeft.setItems(headerLeftData);
        table.setData(tableData);
        table.select(index);
        screen.render();
      } else {
        index = 1;
      }
    }, refreshRate);

    setInterval(async () => {
      if (!monitoringPaused) {
        getStorageDeals(db, data => {
          updateDealStatus(fc, db, data);
        });
      }
    }, 30000); // get the status of the deals every 30 seconds
  } catch (err) {
    Logger.error(err.stack);
    process.exit(0);
  }
}

async function updateDealStatus(fc, db, data) {
  try {
    await Promise.all(
      data.map(async deal => {
        const { dealId, cid, copyNumber, commD_old } = deal;
        const init = commD_old ? false : true;

        const storageDeal = await fc.client.queryStorageDeal(dealId);

        const {
          state,
          proofInfo: { commD, commR, commRStar }
        } = storageDeal;

        const fixityResult = commD === commD_old ? 'pass' : 'FAIL';

        updateFileStatus(
          db,
          cid,
          copyNumber,
          state,
          commD,
          commR,
          commRStar,
          fixityResult,
          init
        );
      })
    );
  } catch (err) {
    Logger.error(err.stack);
  }
}

module.exports = {
  monitor
};
