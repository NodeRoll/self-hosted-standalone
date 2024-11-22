const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const archiver = require('archiver');

async function loadConfig() {
    try {
        const configFile = await fs.readFile('.noderoll.json', 'utf8');
        return JSON.parse(configFile);
    } catch (error) {
        throw new Error('No .noderoll.json found. Run `noderoll init` first.');
    }
}

async function createDeploymentArchive() {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream('deployment.zip');
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', () => resolve());
        archive.on('error', reject);

        archive.pipe(output);
        
        // Add all files except node_modules and .git
        archive.glob('**/*', {
            ignore: ['node_modules/**', '.git/**', 'deployment.zip']
        });

        archive.finalize();
    });
}

async function deploy(options) {
    const spinner = ora('Starting deployment').start();

    try {
        // Load configuration
        spinner.text = 'Loading configuration';
        const config = await loadConfig();

        // Create deployment archive
        spinner.text = 'Creating deployment archive';
        await createDeploymentArchive();

        // Upload to NodeRoll server
        spinner.text = 'Uploading project';
        const formData = new FormData();
        formData.append('file', await fs.readFile('deployment.zip'));
        formData.append('config', JSON.stringify(config));

        const response = await axios.post('http://localhost:3000/api/deploy', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Clean up
        await fs.unlink('deployment.zip');

        spinner.succeed('Deployment successful');
        
        console.log(chalk.green('\n✨ Application deployed successfully!'));
        console.log(chalk.gray('\nDeployment details:'));
        console.log(chalk.white(\`URL: \${response.data.url}\`));
        console.log(chalk.white(\`Status: \${response.data.status}\`));
        
        if (response.data.logs) {
            console.log(chalk.gray('\nDeployment logs:'));
            console.log(chalk.white(response.data.logs));
        }

        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.white('1. Run `noderoll logs` to view application logs'));
        console.log(chalk.white('2. Run `noderoll status` to check deployment status'));

    } catch (error) {
        spinner.fail('Deployment failed');
        console.error(chalk.red(\`Error: \${error.message}\`));
        
        if (error.response && error.response.data) {
            console.error(chalk.red('Server response:', error.response.data));
        }
        
        process.exit(1);
    }
}

module.exports = deploy;
