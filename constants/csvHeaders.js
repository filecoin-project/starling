const listHeader = [
  { id: 'NAME', title: 'Content' },
  { id: 'SIZE', title: 'Size' },
  { id: 'SIZE_BYTES', title: 'Size(Bytes)' },
  { id: 'CID', title: 'CID' },
  { id: 'MINER_ID', title: 'Miner ID' },
  { id: 'DEAL_DATE', title: 'Deal commencement' }
];

const verifyHeader = [
  { id: 'NAME', title: 'Content' },
  { id: 'CID', title: 'CID' },
  { id: 'MINER_ID', title: 'Miner ID' },
  { id: 'DEAL_DATE', title: 'Deal commencement' },
  { id: 'COMMD_ORIGINAL', title: 'Original commD value' },
  { id: 'COMMR_ORIGINAL', title: 'Original commR value' },
  { id: 'COMMRSTAR_ORIGINAL', title: 'Original commRStar value' },
  { id: 'DATE_LAST_CHECK', title: 'Date of last check' },
  { id: 'COMMD_LATEST', title: 'Recalculated commD value' },
  { id: 'COMMR_LATEST', title: 'Recalculated commR value' },
  { id: 'COMMRSTAR_LATEST', title: 'Recalculated commRStar value' },
  { id: 'VERIFY_RESULT', title: 'Verification result' }
];

module.exports = {
  listHeader,
  verifyHeader
};
