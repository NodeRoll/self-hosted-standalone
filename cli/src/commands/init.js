const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const ora = require('ora');

const defaultConfig = {
    name: '',
    type: 'nodejs',
    engine: {
        node: '18-slim'
    },
    scripts: {
        build: 'npm ci && npm run build',
        start: 'npm start'
    },
    resources: {
        memory: '512M',
        cpus: '0.5',
        storage: '1G'
    },
    healthCheck: {
        path: '/health',
        interval: '30s',
        timeout: '5s',
        retries: 3
    }
};

async function detectProjectType() {
    try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        
        // Detect framework/type
        if (packageJson.dependencies) {
            if (packageJson.dependencies['next']) return 'next.js';
            if (packageJson.dependencies['express']) return 'express';
            if (packageJson.dependencies['@nestjs/core']) return 'nest.js';
        }
        
        return 'nodejs';
    } catch {
        return 'nodejs';
    }
}

async function detectScripts() {
    try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        const scripts = {
            build: 'npm ci && npm run build',
            start: 'npm start'
        };

        if (packageJson.scripts) {
            if (packageJson.scripts.build) {
                scripts.build = \`npm ci && \${packageJson.scripts.build}\`;
            }
            if (packageJson.scripts.start) {
                scripts.start = packageJson.scripts.start.startsWith('node') 
                    ? packageJson.scripts.start 
                    : \`npm run \${packageJson.scripts.start}\`;
            }
        }

        return scripts;
    } catch {
        return defaultConfig.scripts;
    }
}

async function init(options) {
    const spinner = ora('Initializing NodeRoll project').start();

    try {
        // Detect project type and scripts
        const detectedType = await detectProjectType();
        const detectedScripts = await detectScripts();

        spinner.succeed('Project analyzed');

        if (!options.yes) {
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Project name:',
                    default: path.basename(process.cwd())
                },
                {
                    type: 'list',
                    name: 'type',
                    message: 'Project type:',
                    choices: ['nodejs', 'next.js', 'express', 'nest.js'],
                    default: detectedType
                },
                {
                    type: 'input',
                    name: 'nodeVersion',
                    message: 'Node.js version:',
                    default: '18-slim'
                },
                {
                    type: 'input',
                    name: 'buildCommand',
                    message: 'Build command:',
                    default: detectedScripts.build
                },
                {
                    type: 'input',
                    name: 'startCommand',
                    message: 'Start command:',
                    default: detectedScripts.start
                },
                {
                    type: 'input',
                    name: 'memory',
                    message: 'Memory limit:',
                    default: '512M'
                },
                {
                    type: 'input',
                    name: 'cpus',
                    message: 'CPU limit:',
                    default: '0.5'
                }
            ]);

            // Create config
            const config = {
                name: answers.name,
                type: answers.type,
                engine: {
                    node: answers.nodeVersion
                },
                scripts: {
                    build: answers.buildCommand,
                    start: answers.startCommand
                },
                resources: {
                    memory: answers.memory,
                    cpus: answers.cpus,
                    storage: '1G'
                },
                healthCheck: defaultConfig.healthCheck
            };

            // Write config
            await fs.writeFile('.noderoll.json', JSON.stringify(config, null, 2));
        } else {
            // Use defaults with detected values
            const config = {
                ...defaultConfig,
                name: path.basename(process.cwd()),
                type: detectedType,
                scripts: detectedScripts
            };
            await fs.writeFile('.noderoll.json', JSON.stringify(config, null, 2));
        }

        console.log(chalk.green('\n✨ NodeRoll project initialized successfully!'));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.white('1. Review .noderoll.json configuration'));
        console.log(chalk.white('2. Run `noderoll deploy` to deploy your application'));
        console.log(chalk.white('3. Run `noderoll logs` to view application logs'));

    } catch (error) {
        spinner.fail('Failed to initialize project');
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}

module.exports = init;
