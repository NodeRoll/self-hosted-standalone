const axios = require('axios');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const DeploymentStrategyFactory = require('./deployment/strategy.factory');
const { Project, Deployment } = require('../models');

class AgentService {
    constructor() {
        this.agentUrl = process.env.AGENT_URL || 'http://localhost:3001';
        this.agentToken = process.env.AGENT_TOKEN;
        this.deployments = new Map();
        
        if (!this.agentToken) {
            logger.warn('AGENT_TOKEN is not set. Agent communication will fail.');
        }
    }

    async handleDeployment(event, payload) {
        const { deploymentId, projectId } = payload;
        
        try {
            // Get deployment and project details
            const deployment = await Deployment.findByPk(deploymentId);
            const project = await Project.findByPk(projectId);
            
            if (!deployment || !project) {
                throw new AppError(404, 'Deployment or project not found');
            }

            // Create deployment strategy
            const strategy = await DeploymentStrategyFactory.createStrategy(deployment, project);
            this.deployments.set(deploymentId, strategy);

            // Update deployment status
            await deployment.update({ status: 'in_progress', startedAt: new Date() });

            // Execute deployment
            switch (event) {
                case 'deployment.create':
                    await this.executeDeployment(strategy, deployment);
                    break;
                case 'deployment.cancel':
                    await this.cancelDeployment(strategy, deployment);
                    break;
                default:
                    throw new AppError(400, `Unknown deployment event: ${event}`);
            }
        } catch (error) {
            logger.error('Deployment failed:', {
                deploymentId,
                error: error.message
            });

            // Update deployment status
            const deployment = await Deployment.findByPk(deploymentId);
            if (deployment) {
                await deployment.update({
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date()
                });
            }

            throw error;
        }
    }

    async executeDeployment(strategy, deployment) {
        try {
            // Validate deployment
            await strategy.validate();

            // Execute deployment
            await strategy.deploy();

            // Update deployment status
            await deployment.update({
                status: 'completed',
                completedAt: new Date()
            });

            logger.info(`Deployment completed successfully: ${deployment.id}`);
        } catch (error) {
            // Cleanup on failure
            try {
                await strategy.cleanup();
            } catch (cleanupError) {
                logger.error('Cleanup failed:', cleanupError);
            }

            throw error;
        }
    }

    async cancelDeployment(strategy, deployment) {
        try {
            await strategy.stop();
            await strategy.cleanup();

            await deployment.update({
                status: 'cancelled',
                completedAt: new Date()
            });

            logger.info(`Deployment cancelled: ${deployment.id}`);
        } catch (error) {
            logger.error('Failed to cancel deployment:', error);
            throw error;
        }
    }

    async getDeploymentLogs(deploymentId) {
        const strategy = this.deployments.get(deploymentId);
        if (!strategy) {
            throw new AppError(404, 'Deployment not found or already completed');
        }

        return strategy.getLogs();
    }

    async getAgentStatus() {
        try {
            const dockerStatus = await this.checkDocker();
            const pm2Status = await this.checkPM2();

            return {
                status: 'online',
                docker: dockerStatus,
                pm2: pm2Status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Agent status check failed:', error);
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkDocker() {
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            await execAsync('docker info');
            return { status: 'available' };
        } catch (error) {
            return { status: 'unavailable', error: error.message };
        }
    }

    async checkPM2() {
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            await execAsync('pm2 ping');
            return { status: 'available' };
        } catch (error) {
            return { status: 'unavailable', error: error.message };
        }
    }
}

module.exports = new AgentService();
