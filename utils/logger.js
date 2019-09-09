const winston = require('winston');
const homedir = require('os').homedir();

const options = {
  file: {
    level: 'info',
    filename: `${homedir}/.starling/logs/starling.log`,
    handleExceptions: true,
    json: true,
    colorize: false
  }
};

const Logger = new winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [new winston.transports.File(options.file)]
});

module.exports = {
  Logger
};
