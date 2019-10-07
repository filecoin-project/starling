#!/usr/bin/env node

const Filecoin = require('filecoin-api-client');
const commander = require('commander');
const { Logger } = require('./utils');

require('dotenv').config();

const program = new commander.Command();
program.version('0.5.6', '-v, --version', 'output the current version');
program.name('starling').usage('<command> [command arguments] [--help]');
program.helpOption('-h, --help', 'read more information');

const { store, list, monitor, retry, verify } = require('./commands');
const { checkHealth, createConfig } = require('./utils');

async function init() {
  try {
    const { apiAddr } = process.env;

    const fc = apiAddr
      ? Filecoin({
          apiAddr: apiAddr
        })
      : Filecoin({ apiAddr: '/ip4/127.0.0.1/tcp/3453/http' });

    await checkHealth(fc);

    program
      .command('store')
      .description('path to file or folder you would like to store')
      .option('<path/to/folder>', 'store a folder')
      .option('<path/to/file>', 'store a file')
      .action(() => {
        store(fc);
      });

    program
      .command('retry')
      .description('retries to upload failed jobs')
      .action(() => {
        retry(fc);
      });

    program.command('get').description('retrieves/downloads a file');

    program
      .command('monitor')
      .description('launches interactive monitoring interface')
      .option(
        '<refresh rate>',
        'a number (in seconds) to set the refresh rate of the interface'
      )
      .action(() => {
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
      .option('<path/to/folder>', 'a path to store the generated csv file')
      .action(() => {
        if (process.argv.length > 4) {
          throw new Error('\nplease provide 1 argument as the directory');
        }
        list();
      });

    program
      .command('verify')
      .description('outputs a csv report of file fixity')
      .option('<path/to/folder>', 'a path to store the generated csv file')
      .action(() => {
        if (process.argv.length > 4) {
          throw new Error('\nplease provide 1 argument as the directory');
        }
        verify();
      });

    program
      .command('help')
      .description('displays this help file')
      .action(() => {
        program.help();
      });

    program
      .command('config')
      .description('modifies the global config settings')
      .action(() => {
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
