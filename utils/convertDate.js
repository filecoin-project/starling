function convertDate(DATE) {
  if (DATE === '00:00:00:00') {
    return DATE;
  }

  let days, hours, minutes, seconds;

  const date = new Date(DATE);
  const dateNow = new Date();

  const dateDiff = parseInt((dateNow - date) / 1000, 10);

  days = format(parseInt(Math.floor(dateDiff / 86400), 10));
  hours = format(parseInt(Math.floor(dateDiff / 3600) % 24, 10));
  minutes = format(parseInt(Math.floor(dateDiff / 60) % 60, 10));
  seconds = format(parseInt(dateDiff % 60, 10));

  return `${days}:${hours}:${minutes}:${seconds}`;
}

function format(param) {
  if (param < 10) {
    return `0${param}`;
  } else {
    return param;
  }
}

module.exports = {
  convertDate
};
