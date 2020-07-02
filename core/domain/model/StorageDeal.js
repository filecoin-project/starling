const values = [
  'Storage Deal Unknown',
  'Storage Deal Proposal Not Found',
  'Storage Deal Proposal Rejected',
  'Storage Deal Proposal Accepted',
  'Storage Deal Staged',
  'Storage Deal Sealing',
  'Storage Deal Active',
  'Storage Deal Failing',
  'Storage Deal Not Found',

  'Storage Deal Funds Ensured',         // Deposited funds as neccesary to create a deal, ready to move forward
  'Storage Deal Waiting For Data Request', // Client is waiting for a request for the deal data
  'Storage Deal Validating',         // Verifying that deal parameters are good
  'Storage Deal Accept Wait',            // Deciding whether or not to accept the deal
  'Storage Deal Transferring',          // Moving data
  'Storage Deal Waiting For Data',        // Manual transfer
  'Storage Deal Verify Data',            // Verify transferred data - generate CAR / piece data
  'Storage Deal Ensure Provider Funds',   // Ensuring that provider collateral is sufficient
  'Storage Deal Ensure Client Funds',     // Ensuring that client funds are sufficient
  'Storage Deal Provider Funding',       // Waiting for funds to appear in Provider balance
  'Storage Deal Client Funding',         // Waiting for funds to appear in Client balance
  'Storage Deal Publish',               // Publishing deal to chain
  'Storage Deal Publishing',            // Waiting for deal to appear on chain
  'Storage Deal Error',                 // deal failed with an unexpected error
  'Storage Deal Completed'
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