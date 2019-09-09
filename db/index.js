const { connect, close } = require('./sqlite');
const { updateFile, insertFile } = require('./functions');

module.exports = {
  connect,
  close,
  updateFile,
  insertFile
};
