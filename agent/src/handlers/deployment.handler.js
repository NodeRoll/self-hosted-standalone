const path = require('path');
const fs = require('fs').promises;
const simpleGit = require('simple-git');
const logger = require('../utils/logger');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class DeploymentHandler {
    constructor() {
        this.workspaceDir = process.env.WORKSPACE_DIR || path.join(process.cwd(), 'workspace');
        this.activeDeployments = new Map();
    }

    async handleDeployment(event, payload) {
        const { deploymentId, projectId, githubRepo, commitHash, branch, envVars } = payload;
        const deploymentDir = path.join(this.workspaceDir, projectId, deploymentId);

        try {
            // Create deployment directory
            await fs.mkdir(deploymentDir, { recursive: true });

            // Clone repository
            await this.cloneRepository(deploymentDir, githubRepo, branch);

            // Checkout specific commit
            await this.checkoutCommit(deploymentDir, commitHash);

            // Detect deployment type and deploy
            const deploymentType = await this.detectDeploymentType(deploymentDir);
            const deployment = await this.createDeployment(deploymentType, {
                deploymentId,
                projectId,
                deploymentDir,
                envVars
            });

            // Store active deployment
            this.activeDeployments.set(deploymentId, deployment);

            // Deploy
            await deployment.deploy();

            return { success: true };
        } catch (error) {
            logger.error('Deployment failed:', error);
            throw error;
        }
    }

    async cloneRepository(deploymentDir, githubRepo, branch) {
        const git = simpleGit();
        const repoUrl = `https://github.com/${githubRepo}.git`;
        
        logger.info(`Cloning repository: ${repoUrl}`);
        await git.clone(repoUrl, deploymentDir, ['--branch', branch]);
    }

    async checkoutCommit(deploymentDir, commitHash) {
        const git = simpleGit(deploymentDir);
        logger.info(`Checking out commit: ${commitHash}`);
        await git.checkout(commitHash);
    }

    async detectDeploymentType(deploymentDir) {
        const hasDockerfile = await this.fileExists(path.join(deploymentDir, 'Dockerfile'));
        if (hasDockerfile) {
            return 'docker';
        }

        const hasPackageJson = await this.fileExists(path.join(deploymentDir, 'package.json'));
        if (hasPackageJson) {
            return 'node';
        }

        throw new Error('Unable to determine deployment type');
    }

    async createDeployment(type, config) {
        switch (type) {
            case 'docker':
                const DockerDeployment = require('../deployments/docker.deployment');
                return new DockerDeployment(config);
            case 'node':
                const NodeDeployment = require('../deployments/node.deployment');
                return new NodeDeployment(config);
            default:
                throw new Error(`Unsupported deployment type: ${type}`);
        }
    }

    async cancelDeployment(deploymentId) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }

        try {
            await deployment.stop();
            this.activeDeployments.delete(deploymentId);
            return { success: true };
        } catch (error) {
            logger.error('Failed to cancel deployment:', error);
            throw error;
        }
    }

    async getDeploymentLogs(deploymentId) {
        const deployment = this.activeDeployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }

        return deployment.getLogs();
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async cleanup() {
        for (const [deploymentId, deployment] of this.activeDeployments) {
            try {
                await deployment.stop();
            } catch (error) {
                logger.error(`Failed to stop deployment ${deploymentId}:`, error);
            }
        }
        this.activeDeployments.clear();
    }
}

module.exports = new DeploymentHandler();
