const blessed = require('blessed');
const chalk = require('chalk');
const { StarlingCore } = require('../../core');
const { LotusWsClient } = require('../../core/infrastructure/lotus/LotusWsClient');

const { Logger, formatBytes, convertDate, truncate } = require('../../utils');
const {
  connect,
  getStorageDeals,
  updateFileStatus,
} = require('../../core/infrastructure/db');
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
      ' ^S '
    )} sort by size ${chalk.white.bgBlack(' ^V ')} sort by content`
  ]
];

const footerExitFilter = [
  [
    `${chalk.white.bgBlack(' esc ')} exit filter`
  ]
];

const footerSortData = [
  [
    `${chalk.white.bgBlack(' ^Q ')} exit sort ${chalk.white.bgBlack(
      ' ^S '
    )} sort by size ${chalk.white.bgBlack(' ^V ')} sort by content`
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
function getTableData(jobs) {
  let data = ['id', 'name', 'status', 'size', 'encryption', 'no. copies', 'elapsed time'];

  const list = jobs.map(job => {
    const {
      uuid,
      name,
      status,
      size,
      encryption,
      date,
      totalCopies
    } = job;

    return [uuid, truncate(name, 30), status, formatBytes(size), encryption, `${totalCopies}`, convertDate(date)]
  });

  return [
    data,
    ...list,
  ];
}

function getRightHeaderData(jobs, activeJobs) {
  const rightHeader = [
    '',
    `Active deals: ${chalk.hex('#00E900')(activeJobs.length)}`,
    `Processing deals: ${chalk.hex('#00E900')(0)}`,
    ``,
    `${progress({ active: activeJobs.length, queued: jobs - activeJobs })}`
  ];

  return rightHeader;
}

function getLeftHeaderData(jobs, miners, wallet) {
  const jobsCount = jobs.length || 0;
  const minersCount = miners.length || 0;
  const balance = wallet.balance || 0;
  const space = jobs.reduce((acc, job) => job.size + acc, 0 );

  const leftHeaderData = [
    ``,
    `Files stored in the network: ${chalk.hex('#A706E2')(jobsCount)}`,
    `# of miners: ${chalk.hex('#A706E2')(minersCount)}`,
    `Storage space used: ${chalk.hex('#A706E2')(
      `${space ? formatBytes(space) : '0 Bytes'}`
    )}`,
    `Wallet balance: ${chalk.hex('#A706E2')(`FIL ${balance * Math.pow(10, -18)}`)}`
  ];

  return leftHeaderData;
}

async function monitor(rate) {
  const client = LotusWsClient.shared();

  try {
    const screen = blessed.screen({
      smartCSR: true
    });

    let index = 1;
    let monitoringPaused = false;
    let sortState = false;

    const refreshRate = rate * 1000 || 5000;
    const db = await connect();

    const core = new StarlingCore();
    core.on('ERROR', error => {
      if (!error) {
        console.log(`\n🚫 Error occured`);
      } else if (error.message) {
        console.log(`\n🚫 Error: ${error.message}`);
      } else {
        console.log(`\n🚫 Error: ${error}`);
      }
    });
    const { miners, jobs, wallet } = await core.getReport();
    const filteredJobs = jobs.filter(job => job.status !== 'STORED');

    const headerRight = getHeaderRight(getRightHeaderData(jobs, filteredJobs));
    const headerLeft = getHeaderLeft(getLeftHeaderData(jobs, miners, wallet));
    const table = getTable(getTableData(filteredJobs));
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

          table.setData(getTableData(jobs.filter(job => job.name.toLowerCase().includes(userInput.toLowerCase()))));
          screen.render();
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
          table.setData(getTableData(jobs.filter(job => job.name.toLowerCase().includes(userInput.toLowerCase()))));
          screen.render();

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
          if (index < jobs.length) {
            index++;
          }
          break;
        case 'C-s':
        case 'C-v':
          monitoringPaused = true;
          sortState = true;

          table.setData(getTableData(jobs.sort((job1, job2) => job1[sortValues[key.full]] > job2[sortValues[key.full]] ? 1 : -1)));
          footer.setData(footerSortData);
          screen.render();
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
      if (!monitoringPaused) {
        const { miners, jobs, wallet } = await core.getReport();
        const filteredJobs = jobs.filter(job => job.status !== 'STORED');
        headerRight.setItems(getRightHeaderData(jobs, filteredJobs));
        headerLeft.setItems(getLeftHeaderData(jobs, miners, wallet));
        table.setData(getTableData(filteredJobs));
        table.select(index);
        screen.render();
      } else {
        index = 1;
      }
    }, refreshRate);

    setInterval(async () => {
      if (!monitoringPaused) {
        const storageDeals = await getStorageDeals(db);
        updateDealStatus(client, db, storageDeals);
      }
    }, 5000); // get the status of the deals every 5 seconds
  } catch (err) {
    if (!err) {
      console.log(`\n🚫 Error occured`);
    } else if (err.message) {
      console.log(`\n🚫 Error: ${err.message}`);
    } else {
      console.log(`\n🚫 Error: ${err}`);
    }
    process.exit(0);
  }
}

async function updateDealStatus(client, db, data) {
  try {
    await Promise.all(
      data.map(async deal => {
        const { dealId, cid, copyNumber, commD_old } = deal;
        const init = commD_old ? false : true;
        const storageDeal = await client.clientGetDealInfo(JSON.parse(dealId));

        await updateFileStatus(
          db,
          cid,
          copyNumber,
          storageDeal.State,
          '',
          '',
          '',
          '',
          init
        );
      })
    );
  } catch (err) {
    Logger.error(err);
  }
}

module.exports = {
  monitor
};
