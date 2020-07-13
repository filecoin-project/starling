const { connect, close } = require('./sqlite');
const {
  updateFile,
  insertFile,
  getStoredFileList,
  getStorageSpace,
  getQueuedFileListCount,
  getActiveFileListCount,
  getFilteredTableContent,
  getQueuedFilesInfo,
  getRetryFiles,
  getStorageDeals,
  updateFileStatus,
  getVerifyList,
  getSortedTableContent,
  getRetrievalFileInfo,
  getFilesByCid,
  getJobStatus,
  getActiveFileList,
  getCompleteFileList
} = require('./functions');

module.exports = {
  connect,
  close,
  updateFile,
  insertFile,
  getStoredFileList,
  getStorageSpace,
  getQueuedFileListCount,
  getActiveFileListCount,
  getFilteredTableContent,
  getQueuedFilesInfo,
  getRetryFiles,
  getStorageDeals,
  updateFileStatus,
  getVerifyList,
  getSortedTableContent,
  getRetrievalFileInfo,
  getFilesByCid,
  getJobStatus,
  getActiveFileList,
  getCompleteFileList
};
