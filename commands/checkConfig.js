const fs = require('fs-extra');

const { createConfig } = require('./createConfig');
const { configFile } = require('../constants/paths');

async function checkConfig() {
  try {
    await fs.open(configFile, 'r');
  } catch (err) {
    await createConfig();
  }
}

module.exports = {
  checkConfig
};
