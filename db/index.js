const { connect, close } = require('./sqlite');
const {
  updateFile,
  insertFile,
  getStoredFileList,
  getStorageSpace,
  getQueuedFileList,
  getActiveFileList,
  getTableData,
  getTableDataNotQueued,
  getFilteredTableContent,
  getQueuedFilesInfo,
  getRetryFiles,
  getStorageDeals,
  updateFileStatus,
  getVerifyList
} = require('./functions');

module.exports = {
  connect,
  close,
  updateFile,
  insertFile,
  getStoredFileList,
  getStorageSpace,
  getQueuedFileList,
  getActiveFileList,
  getTableData,
  getTableDataNotQueued,
  getFilteredTableContent,
  getQueuedFilesInfo,
  getRetryFiles,
  getStorageDeals,
  updateFileStatus,
  getVerifyList
};
