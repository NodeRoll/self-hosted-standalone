const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const logger = require('../../utils/logger');
const configService = require('../config.service');
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

            // Load .noderoll config
            const config = await configService.loadProjectConfig(this.workDir);
            await configService.validateConfig(config);
            this.runtimeConfig = configService.convertToRuntimeConfig(config);

            // Validate or create Dockerfile if it doesn't exist
            const dockerfilePath = path.join(this.workDir, 'Dockerfile');
            try {
                await fs.access(dockerfilePath);
                logger.info('Using existing Dockerfile');
            } catch {
                // If Dockerfile doesn't exist, create one for Node.js app
                await this.createNodeDockerfile();
            }

            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new AppError(400, 'Failed to create or validate Dockerfile');
            }
            throw new AppError(500, 'Docker is not available or accessible');
        }
    }

    async createNodeDockerfile() {
        const { nodeVersion, startCommand, buildCommand } = this.runtimeConfig;
        
        // Parse start command for proper Dockerfile CMD format
        const parsedStartCommand = startCommand.split(' ').map(part => `"${part}"`);
        
        const dockerfileContent = `
# Base image
FROM node:${nodeVersion}

# Working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN ${buildCommand}

# Copy application files
COPY . .

# Default port
ENV PORT=3000

# Expose port
EXPOSE \${PORT}

# Start command
CMD [${parsedStartCommand}]
        `.trim();

        const dockerfilePath = path.join(this.workDir, 'Dockerfile');
        await fs.writeFile(dockerfilePath, dockerfileContent);
        logger.info('Created Dockerfile for Node.js application', {
            nodeVersion,
            startCommand,
            buildCommand
        });
    }

    async deploy() {
        try {
            // Run pre-deploy hooks
            await configService.processHooks(this.runtimeConfig, 'preDeploy', this.workDir);

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

            // Get available port
            const port = await this.getAvailablePort();

            // Prepare environment variables
            const envVars = {
                ...(this.runtimeConfig.env || {}),
                ...(this.project.env_vars || {}),
                PORT: port
            };
            
            // Create env file
            const envFile = path.join(this.workDir, '.env');
            const envContent = Object.entries(envVars)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            await fs.writeFile(envFile, envContent);

            // Run container with resource limits
            const { memory, cpus, storage } = this.runtimeConfig.resourceLimits;
            logger.info(`Starting container ${this.containerName} with resource limits`, {
                memory,
                cpus,
                storage
            });

            await execAsync(`docker run -d \
                --name ${this.containerName} \
                --memory=${memory} \
                --cpus=${cpus} \
                --storage-opt size=${storage} \
                --env-file ${envFile} \
                -p ${port}:${envVars.PORT} \
                --restart unless-stopped \
                ${this.containerName}`);

            // Wait for container to be healthy
            await this.waitForHealthCheck(port);

            // Run post-deploy hooks
            await configService.processHooks(this.runtimeConfig, 'postDeploy', this.workDir);

            return {
                port,
                containerId: (await execAsync(`docker ps -q -f name=${this.containerName}`)).stdout.trim()
            };
        } catch (error) {
            logger.error('Deployment failed:', error);
            throw new AppError(500, `Deployment failed: ${error.message}`);
        }
    }

    async waitForHealthCheck(port) {
        const { path: healthPath, interval, timeout, retries } = this.runtimeConfig.healthCheck;
        const maxRetries = retries || 30;
        const retryDelay = parseInt(interval) || 2000;

        for (let i = 0; i < maxRetries; i++) {
            try {
                await execAsync(`curl -s http://localhost:${port}${healthPath}`);
                logger.info(`Container ${this.containerName} is healthy`);
                return true;
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw new Error('Health check failed after maximum retries');
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    async getAvailablePort() {
        // Get a random port between 3000-9000
        return Math.floor(Math.random() * (9000 - 3000 + 1) + 3000);
    }

    async cleanup() {
        try {
            await execAsync(`docker stop ${this.containerName}`);
            await execAsync(`docker rm ${this.containerName}`);
            await execAsync(`docker rmi ${this.containerName}`);
        } catch (error) {
            logger.warn(`Cleanup failed for ${this.containerName}:`, error);
        }
    }
}

module.exports = DockerDeploymentStrategy;
