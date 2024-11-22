#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
const { init, deploy, logs, rollback, config, domains } = require('../src/commands');

// Check for updates
updateNotifier({ pkg }).notify();

// CLI branding
console.log(chalk.blue(`
███    ██  ██████  ██████  ███████ ██████   ██████  ██      ██      
████   ██ ██    ██ ██   ██ ██      ██   ██ ██    ██ ██      ██      
██ ██  ██ ██    ██ ██   ██ █████   ██████  ██    ██ ██      ██      
██  ██ ██ ██    ██ ██   ██ ██      ██   ██ ██    ██ ██      ██      
██   ████  ██████  ██████  ███████ ██   ██  ██████  ███████ ███████ 
`));
console.log(chalk.gray(`v${pkg.version}`));
console.log();

program
    .version(pkg.version)
    .description('Simple and powerful deployment tool for Node.js applications');

// Initialize a new project
program
    .command('init')
    .description('Initialize a new NodeRoll project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .action(init);

// Deploy the application
program
    .command('deploy')
    .description('Deploy your application')
    .option('-e, --env <environment>', 'Environment to deploy to', 'production')
    .option('--docker', 'Force Docker deployment')
    .option('--no-docker', 'Force non-Docker deployment')
    .action(deploy);

// View logs
program
    .command('logs')
    .description('View application logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <number>', 'Number of lines to show', '100')
    .action(logs);

// Rollback to previous version
program
    .command('rollback')
    .description('Rollback to previous deployment')
    .option('--to <version>', 'Rollback to specific version')
    .action(rollback);

// Manage configuration
program
    .command('config')
    .description('Manage application configuration')
    .option('set <key> <value>', 'Set config value')
    .option('get <key>', 'Get config value')
    .option('list', 'List all config values')
    .option('unset <key>', 'Remove config value')
    .action(config);

// Manage domains
program
    .command('domains')
    .description('Manage custom domains')
    .option('add <domain>', 'Add custom domain')
    .option('remove <domain>', 'Remove custom domain')
    .option('list', 'List all domains')
    .action(domains);

program.parse(process.argv);
