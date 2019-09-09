const ProgressBar = require('progress');

function progress(length) {
  const progressBar = new ProgressBar(':elapsed [:bar] :percent ', {
    complete: '=',
    incomplete: '-',
    head: '>',
    width: 40,
    total: length
  });

  return progressBar;
}

module.exports = {
  progress
};
