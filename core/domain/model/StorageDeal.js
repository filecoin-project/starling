const values = [
  'Storage Deal Unknown',
  'Storage Deal Proposal Not Found',
  'Storage Deal Proposal Rejected',
  'Storage Deal Proposal Accepted',
  'Storage Deal Staged',
  'Storage Deal Sealing',
  'Storage Deal Finalizing',
  'Storage Deal Active',
  'Storage Deal Expired',
  'Storage Deal Slashed',
  'Storage Deal Rejecting',
  'Storage Deal Failing',
  'Storage Deal Funds Ensured',
  'Storage Deal Check For Acceptance',
  'Storage Deal Validating',
  'Storage Deal Accept Wait',
  'Storage Deal Start Data Transfer',
  'Storage Deal Transferring',
  'Storage Deal Waiting For Data',
  'Storage Deal Verify Data',
  'Storage Deal Ensure Provider Funds',
  'Storage Deal Ensure Client Funds',
  'Storage Deal Provider Funding',
  'Storage Deal Client Funding',
  'Storage Deal Publish',
  'Storage Deal Publishing',
  'Storage Deal Error',
];

class StorageDealStatus {
  static fromIdx(idx) {
    const state = values[idx];

    if (state) {
      return state.split(' ').slice(1).join('_').toUpperCase();
    }

    return undefined;
  }
}

module.exports = {
  StorageDealStatus,
}