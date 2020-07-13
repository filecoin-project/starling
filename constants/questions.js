const copiesRegex = new RegExp('^[1-9]$');
const priceRegex = new RegExp('^\\d+$');

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
    message: 'What price (attoFIL) do you want to pay per GB?',
    default: function() {
      return '5000000000';
    },
    validate: function(answer) {
      if (!priceRegex.test(answer)) {
        return 'enter a number';
      }

      return true;
    }
  },
  {
    type: 'input',
    name: 'encryptionKey',
    message:
      `Please opt-in or not for file's encryption. Type 'yes', 'no' or your password.`,
    default: function() {
      return 'yes';
    },
    validate: function(answer) {
      if (answer.length === 0) {
        return `Answer should be 'yes', 'no' or your own encryption password`;
      }

      return true;
    }
  },
];

module.exports = {
  questions
};
