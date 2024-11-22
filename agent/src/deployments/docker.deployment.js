const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const logger = require('../utils/logger');
const BaseDeployment = require('./base.deployment');

class DockerDeployment extends BaseDeployment {
    constructor(config) {
        super(config);
        this.containerName = `noderoll-${config.projectId}-${config.deploymentId}`.toLowerCase();
    }

    async deploy() {
        try {
            // Build Docker image
            logger.info(`Building Docker image: ${this.containerName}`);
            await execAsync(`docker build -t ${this.containerName} ${this.deploymentDir}`);

            // Stop and remove existing container if it exists
            await this.stop().catch(() => {});

            // Prepare environment variables
            const envFlags = Object.entries(this.envVars || {})
                .map(([key, value]) => `-e "${key}=${value}"`)
                .join(' ');

            // Run container
            const cmd = `docker run -d --name ${this.containerName} ${envFlags} ${this.containerName}`;
            await execAsync(cmd);

            // Wait for container to be healthy
            await this.waitForHealthy();

            logger.info(`Container ${this.containerName} started successfully`);
            return true;
        } catch (error) {
            logger.error('Docker deployment failed:', error);
            await this.cleanup();
            throw error;
        }
    }

    async stop() {
        try {
            await execAsync(`docker stop ${this.containerName}`);
            await execAsync(`docker rm ${this.containerName}`);
            return true;
        } catch (error) {
            // Ignore errors if container doesn't exist
            return false;
        }
    }

    async getLogs(tail = 100) {
        try {
            const { stdout } = await execAsync(`docker logs --tail ${tail} ${this.containerName}`);
            return stdout;
        } catch (error) {
            logger.error('Failed to get container logs:', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            await this.stop();
            await execAsync(`docker rmi ${this.containerName}`);
            await super.cleanup();
            return true;
        } catch (error) {
            logger.error('Docker cleanup failed:', error);
            throw error;
        }
    }

    async isHealthy() {
        try {
            const { stdout } = await execAsync(`docker inspect --format='{{.State.Running}}' ${this.containerName}`);
            return stdout.trim() === 'true';
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
        
        throw new Error('Container failed to become healthy');
    }
}

module.exports = DockerDeployment;
