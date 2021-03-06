const homedir = require('os').homedir();
const date = new Date();

const dbPath = `${homedir}/.starling/starling.db`;
const configFile = `${homedir}/.starling/config.json`;
const configPath = `${homedir}/.starling`;
const downloadsPath = `${homedir}/.starling/downloads`;
const csvListPath = `${process.cwd()}/starlingList-${date.toISOString()}.csv`;
const csvVerifyPath = `${process.cwd()}/starlingVerify-${date.toISOString()}.csv`;
const lotusApiTokenPath = `${homedir}/.lotus/token`;
const lotusApiPath = `${homedir}/.lotus/api`;

module.exports = {
  dbPath,
  configPath,
  configFile,
  csvListPath,
  csvVerifyPath,
  downloadsPath,
  lotusApiPath,
  lotusApiTokenPath,
};
