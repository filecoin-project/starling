const multiaddr = require('multiaddr');
const { lotusApiTokenPath, lotusApiPath } = require('../../../constants/paths');
var fs = require('fs');

function getLotusUrl() {
  const fullNodeApiInfo = process.env.FULLNODE_API_INFO;
  let token;
  let multiAddrString;

  if (fullNodeApiInfo) {
    const apiArray = fullNodeApiInfo.split(":");
    const hasToken = apiArray.length === 2;
    token = hasToken ? apiArray[0] : undefined;
    multiAddrString = hasToken ? apiArray[1] : apiArray[0];

  } else {
    token = fs.readFileSync(lotusApiTokenPath, 'utf8');
    multiAddrString = fs.readFileSync(lotusApiPath, 'utf8');
  }

  const addr = multiaddr(multiAddrString);
  const nodeAddr = addr.nodeAddress();

  return token ?
    `ws://${nodeAddr.address}:${nodeAddr.port}/rpc/v0?token=${token}` :
    `ws://${nodeAddr.address}:${nodeAddr.port}/rpc/v0`;
}

module.exports = {
  getLotusUrl,
};
