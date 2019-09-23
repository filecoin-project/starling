const chalk = require('chalk');

const truncate = function(fullStr, strLen) {
  if (fullStr.length <= strLen) return fullStr;

  const separator = chalk.hex('#019CA2')('...');

  var sepLen = 3,
    charsToShow = strLen - sepLen,
    frontChars = Math.ceil(charsToShow / 2),
    backChars = Math.floor(charsToShow / 2);

  return (
    fullStr.substr(0, frontChars) +
    separator +
    fullStr.substr(fullStr.length - backChars)
  );
};

module.exports = {
  truncate
};
