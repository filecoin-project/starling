const multiaddr = require('multiaddr');
const { lotusApiTokenPath, lotusApiPath } = require('../../../constants/paths');
var fs = require('fs');

function getLotusUrl() {
  try {
    const token = fs.readFileSync(lotusApiTokenPath, 'utf8');
    const multiAddrString = fs.readFileSync(lotusApiPath, 'utf8');
    const addr = multiaddr(multiAddrString);
    const nodeAddr = addr.nodeAddress();

    return `ws://${nodeAddr.address}:${nodeAddr.port}/rpc/v0?token=${token}`;
  } catch (error) {
    return "";
  }
}

module.exports = {
  getLotusUrl,
};
