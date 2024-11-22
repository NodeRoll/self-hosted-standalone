const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const logger = require('../utils/logger');
const BaseDeployment = require('./base.deployment');

class NodeDeployment extends BaseDeployment {
    constructor(config) {
        super(config);
        this.processName = `noderoll-${config.projectId}-${config.deploymentId}`.toLowerCase();
        this.processFile = path.join(this.deploymentDir, '.noderoll', 'process.json');
    }

    async deploy() {
        try {
            // Install dependencies
            logger.info(`Installing dependencies for ${this.processName}`);
            await execAsync('npm install --production', { cwd: this.deploymentDir });

            // Create .noderoll directory
            const noderollDir = path.join(this.deploymentDir, '.noderoll');
            await fs.mkdir(noderollDir, { recursive: true });

            // Read package.json
            const packageJson = JSON.parse(
                await fs.readFile(path.join(this.deploymentDir, 'package.json'), 'utf8')
            );

            // Create PM2 process file
            const processConfig = {
                name: this.processName,
                script: packageJson.scripts.start ? 'npm' : packageJson.main || 'index.js',
                args: packageJson.scripts.start ? 'start' : '',
                cwd: this.deploymentDir,
                env: this.envVars || {},
                instances: 1,
                autorestart: true,
                watch: false,
                max_memory_restart: '1G',
                log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
            };

            await fs.writeFile(this.processFile, JSON.stringify(processConfig, null, 2));

            // Stop existing process if running
            await this.stop().catch(() => {});

            // Start the application with PM2
            logger.info(`Starting application: ${this.processName}`);
            await execAsync(`pm2 start ${this.processFile}`);

            // Wait for process to be running
            await this.waitForHealthy();

            logger.info(`Application ${this.processName} started successfully`);
            return true;
        } catch (error) {
            logger.error('Node deployment failed:', error);
            await this.cleanup();
            throw error;
        }
    }

    async stop() {
        try {
            await execAsync(`pm2 delete ${this.processName}`);
            return true;
        } catch (error) {
            // Ignore errors if process doesn't exist
            return false;
        }
    }

    async getLogs(tail = 100) {
        try {
            const { stdout } = await execAsync(`pm2 logs ${this.processName} --lines ${tail} --nostream`);
            return stdout;
        } catch (error) {
            logger.error('Failed to get process logs:', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            await this.stop();
            await super.cleanup();
            return true;
        } catch (error) {
            logger.error('Node cleanup failed:', error);
            throw error;
        }
    }

    async isHealthy() {
        try {
            const { stdout } = await execAsync(`pm2 show ${this.processName}`);
            return stdout.includes('online');
        } catch {
            return false;
        }
    }

    async waitForHealthy(timeout = 30000, interval = 1000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await this.isHealthy()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error('Application failed to start');
    }
}

module.exports = NodeDeployment;
