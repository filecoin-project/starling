const { Client } = require('rpc-websockets');

class LotusWsClient {
  constructor(lotusUrl, authToken) {
    let fullUrl = `${lotusUrl}`;

    if (authToken) {
      fullUrl = fullUrl + `?token=${authToken}`;
    }

    this.ready = false;
    this.client = new Client(fullUrl);
    this.client.on('open', () => {
      this.ready = true;
      // console.log('Lotus connection established!\n');
    });
    this.client.on('error', () => console.log(`Couldn't connect to Lotus`));
    this.client.on('close', () => {
      this.ready = false;
      console.log('Lotus connection closed!\n');
    })
  }

  close() {
    return this.client.close();
  }

  static shared() {
    if (!this.instance) {
      this.instance = new LotusWsClient(
        process.env.LOTUS_URL,
        process.env.LOTUS_AUTH_TOKEN,
      );
    }

    return this.instance;
  }

  async whenReady() {
    if (this.ready) return;
    const waiter = (resolve) => {
      return () => {
        if (this.ready) resolve();
        const t = setTimeout(waiter(resolve), 500);
      }
    }
    await new Promise(resolve => waiter(resolve)());
  }

  async version() {
    await this.whenReady();
    return this.client.call('Filecoin.Version');
  }

  async listMiners() {
    await this.whenReady();
    return await this.client.call('Filecoin.StateListMiners', [null]);
  }

  async minerInfo(address) {
    await this.whenReady();
    return await this.client.call('Filecoin.StateMinerInfo', [address, null]);
  }

  async clientQueryAsk(peerId, address) {
    await this.whenReady();
    return this.client.call('Filecoin.ClientQueryAsk', [peerId, address])
  }

  async clientImport(path, isCar) {
    await this.whenReady();
    return this.client.call('Filecoin.ClientImport', [{ path, isCar }]);
  }

  async clientStartDeal(dataCid, miner, price, duration) {
    await this.whenReady();

    // TODO: DealStartEpoch not passed. Is it a problem?
    return this.client.call('Filecoin.ClientStartDeal', [{
        Data: {
          TransferType: 'graphsync',
          Root: dataCid,
        },
        Wallet: await this.walletDefaultAddress(),
        Miner: miner,
        EpochPrice: `${price}`,
        MinBlocksDuration: duration,
        // DealStartEpoch
      }]
    );
  }

  async clientFindData(dataCid) {
    await this.whenReady();
    return this.client.call('Filecoin.ClientFindData', [dataCid]
    );
  }

  async clientRetrieve(offer, path) {
    await this.whenReady();

    return this.client.call('Filecoin.ClientRetrieve', [offer, {"Path": path,"IsCAR":false}]
    );
  }

  async authVerify(token) {
    await this.whenReady();
    return this.client.call('Filecoin.AuthVerify', [token]);
  }

  async walletDefaultAddress() {
    await this.whenReady();
    return await this.client.call('Filecoin.WalletDefaultAddress')
  }

  async walletBalance(address) {
    await this.whenReady();
    return await this.client.call('Filecoin.WalletBalance', [address])
  }

  async clientGetDealInfo(dealCid) {
    await this.whenReady();
    return await this.client.call('Filecoin.ClientGetDealInfo', [dealCid])
  }

  async stateMarketStorageDeal(dealId) {
    await this.whenReady();
    return await this.client.call('Filecoin.StateMarketStorageDeal', [dealId, null])
  }
}

module.exports = {
  LotusWsClient,
}
