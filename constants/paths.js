const homedir = require('os').homedir();

const dbPath = `${homedir}/.starling/starling.db`;
const configFile = `${homedir}/.starling/config.json`;
const configPath = `${homedir}/.starling`;
const csvPath = `${process.cwd()}/starlingList.csv`;

module.exports = {
  dbPath,
  configPath,
  configFile,
  csvPath
};
