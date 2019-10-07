const blessed = require('blessed');

function getHeaderRight(data) {
  const list = blessed.list({
    align: 'left',
    right: 0,
    items: data,
    keys: true,
    noCellBorders: true,
    scrollable: true,
    tags: true,
    top: 0,
    bottom: 5,
    vi: false,
    width: '50%',
    height: '40%',
    interactive: false
  });

  return list;
}

function getHeaderLeft(data) {
  const list = blessed.list({
    align: 'left',
    left: 3,
    items: data,
    keys: true,
    noCellBorders: true,
    scrollable: true,
    tags: true,
    top: 0,
    bottom: 5,
    vi: false,
    width: '50%',
    height: '40%',
    interactive: false
  });

  return list;
}

function getTable(data) {
  const table = blessed.listtable({
    align: 'left',
    left: 0,
    data: data,
    keys: true,
    noCellBorders: true,
    scrollable: true,
    style: {
      cell: {
        selected: {
          bg: '#FFFFFF',
          fg: '#272727'
        }
      },
      header: {
        fg: 'black',
        bg: '#01AE0B'
      },
      label: {
        fg: '#FFFFFF'
      }
    },
    tags: true,
    top: 6,
    vi: false,
    width: '100%',
    height: '60%',
    interactive: true
  });

  return table;
}

function getFooter(data) {
  const table = blessed.listtable({
    align: 'left',
    left: 0,
    data: data,
    keys: true,
    noCellBorders: true,
    style: {
      header: {
        fg: 'black',
        bg: '#019CA2'
      },
      label: {
        fg: '#FFFFFF'
      }
    },
    tags: true,
    bottom: 1,
    vi: false,
    width: '100%',
    height: '10%'
  });

  return table;
}

function getInput() {
  let input = blessed.textarea({
    width: '100%',
    height: '10%',
    bottom: 0,
    inputOnFocus: true
  });

  return input;
}

module.exports = {
  getHeaderRight,
  getHeaderLeft,
  getTable,
  getFooter,
  getInput
};
