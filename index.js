#!/usr/bin/env node

const Filecoin = require('filecoin-api-client');
const commander = require('commander');
const { Logger } = require('./utils');

const program = new commander.Command();
program.version('0.4.6', '-v, --version', 'output the current version');

const { store, list, monitor } = require('./commands');
const { checkHealth, createConfig } = require('./utils');

const fc = Filecoin({
  apiAddr: '/ip4/104.248.115.24/tcp/3453/http'
});

async function init() {
  try {
    await checkHealth(fc);

    program
      .command('store')
      .description('path to file or folder you would like to store')
      .action(function() {
        store(fc);
      });

    program.command('get').description('retrieves/downloads a file');

    program
      .command('monitor')
      .description('launches interactive monitoring interface')
      .action(function() {
        if (process.argv.length > 4) {
          throw new Error(
            '\nplease provide 1 argument as the monitor refresh rate in seconds'
          );
        } else if (process.argv[3] < 3) {
          throw new Error('\nplease provide a period of 3 seconds or greater');
        }

        monitor(fc, process.argv[3]);
      });

    program
      .command('list')
      .description('outputs a csv of all files  you have stored in filecoin')
      .action(function() {
        if (process.argv.length > 4) {
          throw new Error('\nplease provide 1 argument as the directory');
        }
        list();
      });

    program
      .command('verify')
      .description('outputs a csv report of file fixity');

    program
      .command('help')
      .description('displays this help file')
      .action(function() {
        program.help();
      });

    program
      .command('config')
      .description('modifies the global config settings')
      .action(function() {
        createConfig(false);
      });

    if (process.argv.length < 3) {
      program.help();
    }

    program.parse(process.argv);
  } catch (err) {
    console.log(err.message);
    Logger.error(err.stack);
  }
}

init();
