const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const inquirer = require('inquirer');

const { configPath, configFile } = require('../constants/paths');
const { questions } = require('../constants/questions');

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

module.exports = {
  createConfig
};
