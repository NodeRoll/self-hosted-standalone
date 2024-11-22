const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const logger = require('../../utils/logger');
const DeploymentStrategy = require('./base.strategy');
const { AppError } = require('../../middleware/errorHandler');

class FileDeploymentStrategy extends DeploymentStrategy {
    constructor(deployment, project) {
        super();
        this.deployment = deployment;
        this.project = project;
        this.workDir = path.join(process.env.WORKSPACE_DIR || '/tmp/noderoll', project.id, deployment.id);
        this.processFile = path.join(this.workDir, '.noderoll', 'process.json');
    }

    async validate() {
        try {
            // Check if package.json exists
            const packageJsonPath = path.join(this.workDir, 'package.json');
            await fs.access(packageJsonPath);

            // Read and validate package.json
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            if (!packageJson.scripts || !packageJson.scripts.start) {
                throw new AppError(400, 'package.json must contain a start script');
            }

            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new AppError(400, 'package.json not found in repository');
            }
            throw error;
        }
    }

    async deploy() {
        try {
            // Install dependencies
            logger.info(`Installing dependencies for ${this.project.name}`);
            await execAsync('npm install --production', { cwd: this.workDir });

            // Create .noderoll directory for process management
            const noderollDir = path.join(this.workDir, '.noderoll');
            await fs.mkdir(noderollDir, { recursive: true });

            // Prepare environment variables
            const envVars = this.project.envVars || {};
            const env = { ...process.env, ...envVars };

            // Create PM2 process file
            const processConfig = {
                name: `noderoll-${this.project.id}`,
                script: 'npm',
                args: 'start',
                cwd: this.workDir,
                env: env,
                instances: 1,
                autorestart: true,
                watch: false,
                max_memory_restart: '1G',
                log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
            };

            await fs.writeFile(this.processFile, JSON.stringify(processConfig, null, 2));

            // Stop existing process if running
            await this.stop();

            // Start the application with PM2
            logger.info(`Starting application: ${this.project.name}`);
            await execAsync(`pm2 start ${this.processFile}`);

            // Wait for process to be running
            await this.waitForHealthy();

            return true;
        } catch (error) {
            logger.error('File-based deployment failed:', error);
            throw new AppError(500, `Deployment failed: ${error.message}`);
        }
    }

    async rollback() {
        try {
            // Get previous deployment directory
            const previousDir = path.join(
                process.env.WORKSPACE_DIR || '/tmp/noderoll',
                this.project.id,
                this.deployment.rollbackFromId
            );

            // Copy previous deployment files
            await fs.cp(previousDir, this.workDir, { recursive: true });

            // Deploy the previous version
            await this.deploy();

            return true;
        } catch (error) {
            logger.error('File-based rollback failed:', error);
            throw new AppError(500, `Rollback failed: ${error.message}`);
        }
    }

    async stop() {
        try {
            await execAsync(`pm2 delete noderoll-${this.project.id}`);
            return true;
        } catch (error) {
            // Ignore error if process doesn't exist
            return true;
        }
    }

    async getLogs(tail = 100) {
        try {
            const { stdout } = await execAsync(`pm2 logs noderoll-${this.project.id} --lines ${tail} --nostream`);
            return stdout;
        } catch (error) {
            logger.error('Failed to get logs:', error);
            throw new AppError(500, `Failed to get logs: ${error.message}`);
        }
    }

    async cleanup() {
        try {
            // Stop the process
            await this.stop();

            // Remove workspace
            await fs.rm(this.workDir, { recursive: true, force: true });

            return true;
        } catch (error) {
            logger.error('Cleanup failed:', error);
            throw new AppError(500, `Cleanup failed: ${error.message}`);
        }
    }

    async checkHealth() {
        try {
            const { stdout } = await execAsync(`pm2 show noderoll-${this.project.id}`);
            return stdout.includes('online');
        } catch (error) {
            return false;
        }
    }

    async waitForHealthy(timeout = 30000, interval = 1000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await this.checkHealth()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new AppError(500, 'Application failed to start');
    }
}

module.exports = FileDeploymentStrategy;
