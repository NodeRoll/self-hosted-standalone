#!/usr/bin/env node

const { program } = require('commander');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
const init = require('./commands/init');
const deploy = require('./commands/deploy');
const logs = require('./commands/logs');
const rollback = require('./commands/rollback');
const status = require('./commands/status');

// Check for updates
updateNotifier({ pkg }).notify();

program
    .name('noderoll')
    .description('NodeRoll CLI - Deploy Node.js applications with ease')
    .version(pkg.version);

program
    .command('init')
    .description('Initialize a new NodeRoll project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .action(init);

program
    .command('deploy')
    .description('Deploy the current project')
    .option('-e, --env <environment>', 'Deployment environment', 'production')
    .action(deploy);

program
    .command('logs')
    .description('View application logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <number>', 'Number of lines to show', '100')
    .option('-s, --since <time>', 'Show logs since timestamp (e.g. 2013-01-30, 2013-01-30T13:00:00)')
    .option('-l, --level <level>', 'Filter by log level (info, warn, error, debug)')
    .action(logs);

program
    .command('rollback')
    .description('Roll back to a previous deployment')
    .option('-v, --version <version>', 'Specific version to roll back to')
    .action(rollback);

program
    .command('status')
    .description('Show deployment status')
    .action(status);

program.parse(process.argv);
