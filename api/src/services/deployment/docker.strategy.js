const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const logger = require('../../utils/logger');
const DeploymentStrategy = require('./base.strategy');
const { AppError } = require('../../middleware/errorHandler');

class DockerDeploymentStrategy extends DeploymentStrategy {
    constructor(deployment, project) {
        super();
        this.deployment = deployment;
        this.project = project;
        this.workDir = path.join(process.env.WORKSPACE_DIR || '/tmp/noderoll', project.id, deployment.id);
        this.containerName = `noderoll-${project.id}-${deployment.branch}`.toLowerCase();
    }

    async validate() {
        try {
            // Check if Docker is installed and running
            await execAsync('docker info');

            // Validate Dockerfile exists in the repository
            const dockerfilePath = path.join(this.workDir, 'Dockerfile');
            await fs.access(dockerfilePath);

            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new AppError(400, 'Dockerfile not found in repository');
            }
            throw new AppError(500, 'Docker is not available or accessible');
        }
    }

    async deploy() {
        try {
            // Build Docker image
            logger.info(`Building Docker image for ${this.project.name}`);
            await execAsync(`docker build -t ${this.containerName} ${this.workDir}`);

            // Stop and remove existing container if it exists
            try {
                await execAsync(`docker stop ${this.containerName}`);
                await execAsync(`docker rm ${this.containerName}`);
            } catch (error) {
                // Ignore errors if container doesn't exist
            }

            // Prepare environment variables
            const envVars = this.project.envVars || {};
            const envFlags = Object.entries(envVars)
                .map(([key, value]) => `-e "${key}=${value}"`)
                .join(' ');

            // Run the container
            const portMapping = this.project.port ? `-p ${this.project.port}:${this.project.port}` : '';
            const cmd = `docker run -d --name ${this.containerName} ${portMapping} ${envFlags} ${this.containerName}`;
            
            logger.info(`Starting container: ${this.containerName}`);
            await execAsync(cmd);

            // Wait for container to be healthy
            await this.waitForHealthy();

            return true;
        } catch (error) {
            logger.error('Docker deployment failed:', error);
            throw new AppError(500, `Deployment failed: ${error.message}`);
        }
    }

    async rollback() {
        try {
            // Pull the previous image if it exists
            const previousTag = `${this.containerName}:previous`;
            await execAsync(`docker tag ${this.containerName} ${previousTag}`);
            
            // Stop and remove current container
            await this.stop();

            // Run container with previous image
            await execAsync(`docker run -d --name ${this.containerName} ${previousTag}`);
            
            return true;
        } catch (error) {
            logger.error('Docker rollback failed:', error);
            throw new AppError(500, `Rollback failed: ${error.message}`);
        }
    }

    async stop() {
        try {
            await execAsync(`docker stop ${this.containerName}`);
            await execAsync(`docker rm ${this.containerName}`);
            return true;
        } catch (error) {
            logger.error('Failed to stop container:', error);
            throw new AppError(500, `Failed to stop container: ${error.message}`);
        }
    }

    async getLogs(tail = 100) {
        try {
            const { stdout } = await execAsync(`docker logs --tail ${tail} ${this.containerName}`);
            return stdout;
        } catch (error) {
            logger.error('Failed to get container logs:', error);
            throw new AppError(500, `Failed to get logs: ${error.message}`);
        }
    }

    async cleanup() {
        try {
            // Remove container and image
            await this.stop();
            await execAsync(`docker rmi ${this.containerName}`);
            
            // Cleanup workspace
            await fs.rm(this.workDir, { recursive: true, force: true });
            
            return true;
        } catch (error) {
            logger.error('Cleanup failed:', error);
            throw new AppError(500, `Cleanup failed: ${error.message}`);
        }
    }

    async checkHealth() {
        try {
            const { stdout } = await execAsync(`docker inspect --format='{{.State.Health.Status}}' ${this.containerName}`);
            return stdout.trim() === 'healthy';
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
        
        throw new AppError(500, 'Container failed to become healthy');
    }
}

module.exports = DockerDeploymentStrategy;
