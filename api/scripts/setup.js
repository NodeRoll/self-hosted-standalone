const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

async function setup() {
    logger.info('Starting NodeRoll setup...');

    // Create necessary directories
    const dirs = ['logs', 'data'];
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
            logger.info(`Created directory: ${dir}`);
        }
    });

    // Check Node.js version
    const nodeVersion = process.version;
    logger.info(`Node.js version: ${nodeVersion}`);
    if (parseInt(nodeVersion.slice(1)) < 14) {
        throw new Error('NodeRoll requires Node.js version 14 or higher');
    }

    // Install dependencies
    try {
        logger.info('Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
        logger.error('Failed to install dependencies:', error);
        process.exit(1);
    }

    // Create .env file if it doesn't exist
    const envPath = path.join(__dirname, '..', '.env');
    const envExamplePath = path.join(__dirname, '..', '.env.example');
    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        logger.info('Created .env file from .env.example');
    }

    // Run database migrations
    try {
        logger.info('Running database migrations...');
        execSync('npx sequelize-cli db:migrate', {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        logger.info('Database migrations completed successfully');
    } catch (error) {
        logger.error('Failed to run migrations:', error);
        process.exit(1);
    }

    // Check for required tools
    try {
        logger.info('Checking required tools...');
        
        // Check Docker
        try {
            execSync('docker --version', { stdio: 'pipe' });
            logger.info('Docker is installed');
        } catch (error) {
            logger.warn('Docker is not installed. Docker-based deployments will not be available.');
        }

        // Check PM2
        try {
            execSync('pm2 --version', { stdio: 'pipe' });
            logger.info('PM2 is installed');
        } catch (error) {
            logger.warn('PM2 is not installed. Installing PM2...');
            execSync('npm install -g pm2', { stdio: 'inherit' });
            logger.info('PM2 installed successfully');
        }
    } catch (error) {
        logger.error('Error checking required tools:', error);
    }

    logger.info('Setup completed successfully!');
    logger.info('You can now start NodeRoll by running: npm start');
}

setup().catch(error => {
    logger.error('Setup failed:', error);
    process.exit(1);
});
