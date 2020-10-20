const multiaddr = require('multiaddr');
const { lotusApiTokenPath, lotusApiPath } = require('../../../constants/paths');
var fs = require('fs');

async function getLotusUrl() {
  try {
    const token = await readFile(lotusApiTokenPath);
    const multiAddrString = await readFile(lotusApiPath);
    const addr = multiaddr(multiAddrString);
    const nodeAddr = addr.nodeAddress();

    return `ws://${nodeAddr.address}:${nodeAddr.port}/rpc/v0?token=${token}`;
  } catch (error) {
    return "";
  }
}

function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports = {
  getLotusUrl,
};
