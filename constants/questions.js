const copiesRegex = new RegExp('^[1-9]$');
const priceRegex = new RegExp('^[1-9][0-9]?$|^100$');

const questions = [
  {
    type: 'input',
    name: 'copies',
    message:
      'how many copies of your data do you want to store on the network?',
    default: function() {
      return '1';
    },
    validate: function(answer) {
      if (!copiesRegex.test(answer)) {
        return 'enter a value between 1 and 9';
      }

      return true;
    }
  },
  {
    type: 'input',
    name: 'price',
    message: 'What price ($USD) do you want to pay per TB?',
    default: function() {
      return '1';
    },
    validate: function(answer) {
      if (!priceRegex.test(answer)) {
        return 'enter a value between 0 and 100';
      }

      return true;
    }
  },
  {
    type: 'input',
    name: 'email',
    message:
      '==> Sometimes there are background tasks that take a long time (like syncing with the Filecoin network) and it’s best if Starling can send you an email notification when these processes are complete. What email address should we send these notifications to? Your email won’t be shared with anyone, and will only be stored in your Starling instance. You can leave this blank if you would prefer to opt-out of email notifications:'
  }
];

module.exports = {
  questions
};
