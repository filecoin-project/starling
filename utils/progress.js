const ProgressBar = require('progress');
const chalk = require('chalk');

function progress(total) {
  const progressBar = new ProgressBar(
    `${chalk.hex('#00E900')(':elapsed s [:bar] :percent')}`,
    {
      complete: '=',
      incomplete: '-',
      head: '>',
      width: 40,
      total: total
    }
  );

  return progressBar;
}

function partialProgress(total) {
  const progressBar = new ProgressBar(
    `${chalk.hex('#F06201')(':elapsed [:bar] :percent')}`,
    {
      complete: '=',
      incomplete: '-',
      head: 'X',
      width: 40,
      total: total
    }
  );

  return progressBar;
}

function failedProgress() {
  const progressBar = new ProgressBar(
    `${chalk.hex('#F90401')(':elapsed [:bar]')}`,
    {
      complete: '',
      incomplete: '-',
      head: 'x',
      width: 40,
      total: 40
    }
  );

  return progressBar;
}

module.exports = {
  progress,
  partialProgress,
  failedProgress
};
