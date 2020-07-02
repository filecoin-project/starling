#!/usr/bin/env node

const { LotusWsClient } = require('./core/infrastructure/lotus/LotusWsClient');
const commander = require('commander');
const { Logger } = require('./utils');

require('dotenv').config();

const program = new commander.Command();
program.version('0.5.6', '-v, --version', 'output the current version');
program.name('starling').usage('<command> [command arguments] [--help]');
program.helpOption('-h, --help', 'read more information');

const { store, list, monitor, retry, verify, get } = require('./commands');
const { createConfig } = require('./utils');

async function init() {
  try {
    program
      .command('store')
      .description('path to file or folder you would like to store')
      .option('<path/to/folder>', 'store a folder')
      .option('<path/to/file>', 'store a file')
      .action(() => {
        store();
      });

    program
      .command('retry')
      .description('retries to upload failed jobs')
      .action(() => {
        retry();
      });

    program
      .command('get')
      .description('retrieves/downloads a file')
      .option('<file id>', 'id of the file to retrieve')
      .option('<output path>', 'path to where the retrieved file will be stored')
      .action( () => {
        get();
      });

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

        monitor(process.argv[3]);
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
    console.log(err);
    Logger.error(err.stack);
  }
}

init();
