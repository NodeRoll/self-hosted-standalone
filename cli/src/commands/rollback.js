const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const inquirer = require('inquirer');

async function rollback(options) {
    const spinner = ora('Fetching deployment history').start();

    try {
        // Get project info from local config
        const configFile = await fs.readFile('.noderoll.json', 'utf8');
        const config = JSON.parse(configFile);

        // Get deployment history
        const response = await axios.get(\`http://localhost:3000/api/deployments/\${config.name}\`);
        const deployments = response.data;

        spinner.succeed('Deployment history retrieved');

        if (deployments.length === 0) {
            console.log(chalk.yellow('No previous deployments found'));
            process.exit(0);
        }

        // If version is specified, roll back to that version
        if (options.version) {
            const targetDeployment = deployments.find(d => d.version === options.version);
            if (!targetDeployment) {
                console.error(chalk.red(\`Version \${options.version} not found\`));
                process.exit(1);
            }
            await performRollback(config.name, targetDeployment.version);
            return;
        }

        // Otherwise, show interactive prompt
        const choices = deployments.map(d => ({
            name: \`[\${d.version}] \${new Date(d.timestamp).toLocaleString()} - \${d.status}\`,
            value: d.version
        }));

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'version',
                message: 'Select version to roll back to:',
                choices
            },
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to roll back to this version?',
                default: false
            }
        ]);

        if (answer.confirm) {
            await performRollback(config.name, answer.version);
        } else {
            console.log(chalk.yellow('Rollback cancelled'));
        }
    } catch (error) {
        spinner.fail('Rollback failed');
        console.error(chalk.red(\`Error: \${error.message}\`));
        
        if (error.response && error.response.data) {
            console.error(chalk.red('Server response:', error.response.data));
        }
        
        process.exit(1);
    }
}

async function performRollback(projectName, version) {
    const spinner = ora('Rolling back deployment').start();

    try {
        await axios.post(\`http://localhost:3000/api/rollback\`, {
            project: projectName,
            version: version
        });

        spinner.succeed('Rollback successful');
        
        console.log(chalk.green(\`\\n✨ Successfully rolled back to version \${version}\`));
        console.log(chalk.gray('\\nNext steps:'));
        console.log(chalk.white('1. Run `noderoll logs` to view application logs'));
        console.log(chalk.white('2. Run `noderoll status` to check deployment status'));
    } catch (error) {
        spinner.fail('Rollback failed');
        throw error;
    }
}

module.exports = rollback;
