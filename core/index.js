const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');
const shortid = require('shortid');
const splitFile = require('split-file');

const { LotusWsClient } = require('./infrastructure/lotus/LotusWsClient');
const { formatBytes, waitTimeout } = require('./application/resource/utils');
const { encrypt, decrypt } = require('./application/resource/aes');
const { Logger } = require('./infrastructure/log');
const { shuffleArray } = require('../core/application/resource/shuffle');
const { updateFile, insertFile, connect, close, getFilesByCid, getStoredFileList, getRetrievalFileInfo, getCompleteFileList } = require('./infrastructure/db');

async function getPathInfo(pathName) {
  try {
    const stats = await fs.stat(pathName);
    const fileSize = stats.size;
    const fileName = path.basename(pathName);

    if (stats.isFile()) {
      return {
        status: 'file',
        fileName,
        fileSize,
        pathName,
      };
    } else if (stats.isDirectory()) {
      return {
        status: 'directory',
        fileName,
        fileSize,
        pathName,
      };
    }
  } catch (error) {
    throw "Please check again the provided path";
  }
}

class StarlingCore extends EventEmitter {
  async list() {
    const db = await connect();
    const list = getStoredFileList(db);
    close(db);

    return list;
  }

  async splitFiles(pathName, sectorSize) {
    const splitFilesInfo = await this.split(pathName, sectorSize);
    this.emit('STORE_FILES_SPLIT', splitFilesInfo);

    return splitFilesInfo;
  }

  async importFiles(pathInfosForImport, db, isEncrypted, originalName) {
    const importedFiles = [];
    const uuid = `STRLNG-${shortid.generate()}`;

    for (let pathInfo of pathInfosForImport) {
      const importedFile = await this.importFile(db, pathInfo, uuid, isEncrypted, originalName);
      importedFiles.push(importedFile);

      this.emit('STORE_FILE_IMPORT', {
        cid: importedFile.cid,
        fileName: pathInfo.fileName,
      });
    }

    return importedFiles;
  }

  async makeDeals(pathInfosForImport, importedFiles, miners, noOfCopies, db, basePrice) {
    for (let pathInfo of pathInfosForImport) {
      let copiesCount = 0;
      for (let miner of miners) {
        if (copiesCount === noOfCopies) {
          break;
        }
        Logger.info(`storing ${pathInfo.fileName} with miner ${miner}`);

        try {
          const deal = await this.proposeDeal(
            db,
            importedFiles[pathInfosForImport.indexOf(pathInfo)].cid,
            pathInfo.fileName,
            pathInfo.fileSize,
            miner.miner,
            basePrice,
            importedFiles[pathInfosForImport.indexOf(pathInfo)].copyNumber,
          );
          copiesCount = copiesCount + 1;
          this.emit('STORE_DEAL_MADE', {
            cid: deal.cid,
            miner: deal.miner,
            fileName: pathInfo.fileName,
          });
        } catch (err) {
          Logger.error(err);
        }
      }
    }
  }

  async store(pathName, basePrice, noOfCopies, encryptionKey) {
    try {
      let pathInfo = await getPathInfo(pathName);
      const db = await connect();
      const originalName = path.basename(pathName);
      if (pathInfo.status === 'directory') {
        return;
      }
      await waitTimeout(1);
      this.emit('STORE_FIND_MINERS_STARTED');
      const miners = await this.getMinersAsks();
      const sectorSize = (miners[0].maxPieceSize + miners[0].minPieceSize) / 2;

      pathInfo = await getPathInfo(pathName);

      if (encryptionKey) {
        this.emit('STORE_ENCRYPTION_STARTED');
        const encryptedPathName = `${pathName}-encrypted`;
        await encrypt(pathName, encryptedPathName, encryptionKey)
        this.emit('STORE_ENCRYPTION_FINISHED');
        pathInfo = await getPathInfo(encryptedPathName);
      }

      let pathInfosForImport = [pathInfo];

      if (sectorSize < pathInfo.fileSize) {
        this.emit('STORE_FILE_SPLIT_STARTED');
        pathInfosForImport = await this.splitFiles(pathInfo.pathName, sectorSize);
      }

      this.emit('STORE_IMPORT_STARTED');
      const importedFiles = await this.importFiles(pathInfosForImport, db, !!encryptionKey, originalName);

      this.emit('STORE_DEALS_STARTED');
      await this.makeDeals(pathInfosForImport, importedFiles, miners, noOfCopies, db, basePrice);

      this.emit('STORE_DONE');
      close(db);
    } catch (error) {
      this.emit('ERROR', error);
    }
  }

  async proposeDeal(
    db,
    cid,
    name,
    size,
    miner,
    basePrice,
    copyIdx,
  ) {
    const client = LotusWsClient.shared();
    const price = Math.ceil((basePrice * size) / (1024 * 1024 * 1024));
    const dealCid = await client.clientStartDeal(
      cid,
      miner,
      price + (copyIdx - 1),
      80640
    );
    const storageDealProposal = await client.clientGetDealInfo(dealCid);
    const deal = {
      dealID: JSON.stringify(dealCid),
      minerID: miner,
      signature: '',
      state: storageDealProposal['State'],
      CID: JSON.stringify(cid),
    };
    await updateFile(db, name, deal, copyIdx);

    return {
      cid,
      miner,
    };
  }

  async split(filePath, size) {
    try {
      const splitFiles = await splitFile.splitFileBySize(filePath, size);
      const splitFilesInfo = await Promise.all(
        splitFiles.map(file => getPathInfo(file))
      );

      return splitFilesInfo;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async importFile(
    db,
    pathInfo,
    uuid,
    isEncrypted,
    originalName
  ) {
    const client = LotusWsClient.shared();
    const cid = await client.clientImport(pathInfo.pathName, false);
    const formattedSize = formatBytes(pathInfo.fileSize);

    const existingFiles = await getFilesByCid(db, JSON.stringify(cid));
    let copyNumber;
    let validUuid = uuid;

    if (existingFiles.length === 0) {
      copyNumber = 1;
    } else {
      copyNumber = existingFiles.reduce((acc, val) => {
        return acc < val.COPY_NUMBER ? val.COPY_NUMBER : acc;
      }, 0) + 1;
      validUuid = existingFiles[0].UUID;
    }

    await insertFile(db, validUuid, JSON.stringify(cid), pathInfo.fileName, pathInfo.fileSize, formattedSize, copyNumber, isEncrypted, originalName);

    return {
      cid,
      copyNumber,
    };
  }

  getMinerAsk(peerId, miner) {
    const client = LotusWsClient.shared();
    const askPromise = client.clientQueryAsk(peerId, miner);
    const timeoutPromise = waitTimeout(30);

    return Promise.race([askPromise, timeoutPromise]);
  }

  async getMinersAsks() {
    const client = LotusWsClient.shared();
    let miners = await client.listMiners();
    miners = shuffleArray(miners);
    const infos = await Promise.all(miners.map(miner => client.minerInfo(miner)));
    const peerIds = infos.map(info => info.PeerId);
    const storageAsks = await Promise.all(miners.map(async (miner, idx) => {
      try {
        return await this.getMinerAsk(peerIds[idx], miner);
      } catch (error) {
        return null;
      }
    }));
    const formattedStorageAsks = storageAsks.filter(storageAsk => !!storageAsk).map(storageAsk => ({
      miner: storageAsk.Ask.Miner,
      askPrice: storageAsk.Ask.Price,
      minPieceSize: storageAsk.Ask.MinPieceSize,
      maxPieceSize: storageAsk.Ask.MaxPieceSize,
    }));
    Logger.info('asks', formattedStorageAsks);
    return formattedStorageAsks;
  }

  async get(uuid, path, copyNumber, encryptionKey) {
    try {
      const client = LotusWsClient.shared();
      let anyCopy = false;
      const db = await connect();

      if (isNaN(copyNumber)) {
        copyNumber = 1;
        anyCopy = true;
      }

      await getRetrievalFileInfo(db, uuid, copyNumber, async data => {
        const numberOfFiles = data.length;
        let allFilesDownloaded = true;
        let files = [];
        let isEncrypted = false;

        if (numberOfFiles == 0) {
          this.emit('ERROR', `No files found for uuid: ${uuid}, copy number: ${copyNumber}`);
          return;
        }

        this.emit('DOWNLOAD_START', {fileName: data[0].ORIGINAL_NAME, numberOfPieces: numberOfFiles});
        await Promise.all( data.map(async (file) => {
          const { CID, NAME, DEAL_ID, ENCRYPTED, MINER_ID } = file;
          const storageDealProposal = await client.clientGetDealInfo(JSON.parse(DEAL_ID)).catch(err => this.emit('ERROR', err) );
          const marketStorageDeal = await client.stateMarketStorageDeal(storageDealProposal.DealID).catch(err => this.emit('ERROR', err) );
          isEncrypted = (ENCRYPTED === 'true');

          const status = storageDealProposal.State;
          if (status != 6 ) {
            allFilesDownloaded = false;
            this.emit('ERROR_PIECE', `Deal not active for ${NAME}`);
            return;
          }

          const clientId = marketStorageDeal.Proposal.Client;

          files.push(NAME);

          if (numberOfFiles > 1) {
            this.emit('DOWNLOAD_START_PIECE', NAME);
          }
          Logger.info(`started downloading ${NAME}`);

          const allOffers = await client.clientFindData(JSON.parse(CID));
          if (allOffers.length === 0) {
            this.emit('ERROR_PIECE', `Couldn't find any retrieval offers for ${NAME}`);
            Logger.info(`failed to download ${NAME}`);
            return;
          }

          const offer = allOffers.filter( item => {
            let isValid = false;
            if (item.Size > 0) isValid = true;

            if (!anyCopy) {
              if (item.Miner === MINER_ID) isValid = true;
              else isValid = false;
            }

            return isValid;
          })

          if (offer.length === 0) {
            this.emit('ERROR_PIECE', `Couldn't find any valid (size >0) retrieval offers for ${NAME}`);
            Logger.info(`failed to download ${NAME}`);
            return;
          }

          const retrievalOrder = {
            Root: offer[0].Root,
            Size: offer[0].Size,
            Total: offer[0].MinPrice,
            PaymentInterval: offer[0].PaymentInterval,
            PaymentIntervalIncrease: offer[0].PaymentIntervalIncrease,
            Client: clientId,
            Miner: offer[0].Miner,
            MinerPeerID: offer[0].MinerPeerID,
          }
          const err = await client.clientRetrieve(retrievalOrder, `${path}/downloaded.${NAME}`).catch(err => this.emit('ERROR', err) );
          if (err) {
            allFilesDownloaded = false;
            if (numberOfFiles === 1) {
              this.emit('DOWNLOAD_FAIL', NAME);
            } else {
              this.emit('DOWNLOAD_FAIL_PIECE', NAME);
            }
            Logger.info(`failed to download ${NAME}`);
            return;
          }

          if (numberOfFiles === 1 && isEncrypted) {
            this.emit('DECRYPT_START', NAME);
            await decrypt(`${path}/downloaded.${NAME}`,`${path}/decrypted.${NAME}`, encryptionKey);
          }

          if (numberOfFiles === 1) {
            this.emit('DOWNLOAD_SUCCESS', NAME);
          } else {
            this.emit('DOWNLOAD_SUCCESS_PIECE', NAME);
          }

          Logger.info(`completed downloading ${NAME}`);

          return;
        }));

        const filesWithPaths = [];
        files.forEach( f => filesWithPaths.push(`${path}/${f}`));

        if (numberOfFiles > 1 && allFilesDownloaded) {
          const fileName = data[0].ORIGINAL_NAME;
          splitFile
            .mergeFiles(filesWithPaths, `${path}/downloaded.${fileName}`)
            .then(async () => {
              if (isEncrypted) {
                this.emit('DECRYPT_START', fileName);
                await decrypt(`${path}/downloaded.${fileName}`,`${path}/decrypted.${fileName}`, encryptionKey);
              }
              this.emit('DOWNLOAD_SUCCESS', fileName);
              Logger.info(`completed downloading ${fileName}`);

            })
            .catch(err => {
              this.emit('DOWNLOAD_MERGE_ERROR', fileName);
              Logger.error(err);
            });
        }
      });
      close(db);
    } catch (err) {
      console.log(err);
      Logger.error(err.stack);
    }
  }

  getReportStatus(files) {
    let imported = true;
    let active = true;

    for(const file of files) {
      if (file.STATUS !== 'IMPORTED') {
        imported = false;
      }
      if (file.STATUS !== 'DEAL_ACTIVE') {
        active = false;
      }
    }

    if (imported) { return 'IMPORTED' }

    if (active) { return 'STORED' }

    return 'STORING';
  }

  async getReport() {
    try {
      const db = await connect();
      const files = await getStoredFileList(db);

      const client = LotusWsClient.shared();

      const miners = await client.listMiners();
      const walletAddress = await client.walletDefaultAddress();
      const walletBalance = await client.walletBalance(walletAddress);

      const mapByUuid = files.reduce((acc, file) => {
        return {
          ...acc,
          [file.UUID]: [...(acc[file.UUID] || []), file],
        }
      }, {});

      const jobs = Object.keys(mapByUuid).map(uuid => {
        const files = mapByUuid[uuid];
        const name = files[0].ORIGINAL_NAME;
        const status = this.getReportStatus(files);

        const size = files.reduce((acc, file) => file.COPY_NUMBER === 1 ? acc + file.SIZE_BYTES : acc, 0);
        const encryption = files[0].ENCRYPTED ? 'enabled' : 'disabled';
        const date = files[0].DATETIME_STARTED;
        const totalCopies = files.reduce((acc, file) => file.COPY_NUMBER > acc ? file.COPY_NUMBER : acc, 0);
        return {
          uuid,
          name,
          status,
          size,
          encryption,
          date,
          totalCopies,
        }
      });

      return {
        miners,
        wallet: {
          balance: walletBalance,
        },
        jobs,
      }
    } catch (error) {
      this.emit('ERROR', error);
    }
  }

  async getListReport() {
    try {
      const db = await connect();
      const files = await getStoredFileList(db);

      const mapByUuid = files.reduce((acc, file) => {
        return {
          ...acc,
          [file.UUID]: [...(acc[file.UUID] || []), file],
        }
      }, {});

      const jobs = Object.keys(mapByUuid).map(uuid => {
        const files = mapByUuid[uuid];
        const name = files[0].ORIGINAL_NAME;
        const status = this.getReportStatus(files);
        const size = files.reduce((acc, file) => file.COPY_NUMBER === 1 ? acc + file.SIZE_BYTES : acc, 0);
        const encryption = files[0].ENCRYPTED ? 'enabled' : 'disabled';
        const date = files[0].DATETIME_STARTED;
        const totalCopies = files.reduce((acc, file) => file.COPY_NUMBER > acc ? file.COPY_NUMBER : acc, 0);

        return {
          uuid,
          name,
          status,
          size: formatBytes(size),
          encryption,
          date,
          totalCopies,
        }
      });

      return {
        jobs,
      }
    } catch (error) {
      this.emit('ERROR', error);
    }
  }

  async verify() {
    try {
      const db = await connect();
      const client = LotusWsClient.shared();
      const files = await getCompleteFileList(db);
      const mapByUuid = files.reduce((acc, file) => {
        const accByUuid = acc[file.UUID] || {};
        return {
          ...acc,
          [file.UUID]: {
            ...accByUuid,
            [file.CID]: [...(accByUuid[file.CID] || []), file.STATUS],
          }}
      }, {});
      const filteredMapByUuid = Object.keys(mapByUuid).reduce((acc, uuid) => {
        const cids = Object.keys(mapByUuid[uuid]);
        const result = cids.reduce((acc, cid) => {
          const valid = mapByUuid[uuid][cid].filter(status => status === 'DEAL_ACTIVE').length === mapByUuid[uuid][cid].length;
          return valid ? mapByUuid[uuid] : null;
        }, {})

        return !result ? acc : {
          ...acc,
          [uuid]: result
        };
      }, {});

      const results = {};

      for (let uuid of Object.keys(filteredMapByUuid)) {
        const cids = Object.keys(filteredMapByUuid[uuid]);

        let cidResults = [];
        for (let cid of cids) {
          const findResult = await client.clientFindData(JSON.parse(cid));

          if (findResult.length === 0) {
            cidResults.push(false);
          } else if (!findResult[0]['Size']) {
            cidResults.push(false)
          } else {
            cidResults.push(true)
          }
        }

        if (cidResults.filter(cidResult => !!cidResult).length === cids.length) {
          results[uuid] = 'passed';
        } else {
          results[uuid] = 'failed';
        }
      }

      const data = Object.keys(results).map(uuid => {
        const filterFiles = files.filter(file => file.UUID === uuid);
        const name = filterFiles[0].ORIGINAL_NAME;
        const date = filterFiles[0].DATETIME_STARTED;

        return {
          uuid,
          name,
          fixityCheck: results[uuid],
          date,
        }
      });
      close(db);

      return data;
    } catch (error) {
      this.emit('ERROR', error);
    }
  }
}

module.exports = {
  StarlingCore,
}