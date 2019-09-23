const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const inquirer = require('inquirer');

const { configPath, configFile } = require('../constants/paths');
const { questions } = require('../constants/questions');
const { Logger } = require('./logger');

async function createConfig(init) {
  mkdirp(configPath);

  if (init) {
    console.log(
      `Let’s get started by setting some global preferences for your installation. You can always change these later by running “starling config”. \n`
    );
  } else {
    console.log(
      `Let’s get started by setting some global preferences for your Starling instance. You can always change these later by running “starling config” again. \n`
    );
  }

  const responses = await inquirer.prompt(questions);
  const json = JSON.stringify(responses);

  fs.writeFile(configFile, json, 'utf8');

  console.log(
    '\n==> Thanks! If you’re just getting started, try “starling --help”, or read the docs at: https://github.com/filecoin-project/starling'
  );
}

async function checkHealth(fc) {
  try {
    await fc.id();
  } catch (err) {
    throw new Error(
      "Error: couldn't connect to your filecoin node; please make sure your filecoin daemon is running and that your address is correct"
    );
  }
}

async function checkConfig() {
  try {
    await fs.open(configFile, 'r');
  } catch (err) {
    await createConfig();
  }
}

async function readConfig() {
  try {
    const file = await fs.readJson(configFile);
    return file;
  } catch (err) {
    console.log('could not read config file');
    Logger.error(err.stack);
  }
}

module.exports = {
  createConfig,
  checkHealth,
  checkConfig,
  readConfig
};
