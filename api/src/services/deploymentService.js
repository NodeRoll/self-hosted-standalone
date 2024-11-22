const dockerService = require('./dockerService');
const monitoringService = require('./monitoringService');
const Deployment = require('../models/deployment');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class DeploymentService {
    constructor() {
        // Listen for monitoring events
        monitoringService.on('health_alert', this._handleHealthAlert.bind(this));
        monitoringService.on('metrics', this._handleMetricsUpdate.bind(this));
    }

    async createDeployment(projectName, options) {
        const version = options.version || this._generateVersion();
        
        try {
            // Create deployment record
            const deployment = await Deployment.create({
                projectName,
                version,
                status: 'pending',
                environment: options.environment || {},
                config: options.config || {},
                resources: options.resources || {},
                deployedBy: options.deployedBy
            });

            // Start deployment process
            this._processDeployment(deployment).catch(error => {
                logger.error(`Deployment failed for ${projectName}:${version}`, error);
                this._updateDeploymentStatus(deployment.id, 'failed', { error: error.message });
            });

            return deployment;
        } catch (error) {
            logger.error('Error creating deployment:', error);
            throw error;
        }
    }

    async rollback(projectName, version) {
        try {
            // Find the target deployment
            const targetDeployment = await Deployment.findOne({
                where: { projectName, version }
            });

            if (!targetDeployment) {
                throw new Error(`Deployment ${projectName}:${version} not found`);
            }

            // Find current active deployment
            const currentDeployment = await Deployment.findOne({
                where: { projectName, status: 'running' }
            });

            if (currentDeployment) {
                // Stop current deployment
                await this.stopDeployment(currentDeployment.id);
            }

            // Create new deployment based on target version
            return await this.createDeployment(projectName, {
                version: this._generateVersion(),
                environment: targetDeployment.environment,
                config: targetDeployment.config,
                resources: targetDeployment.resources,
                metadata: {
                    rolledBackFrom: currentDeployment?.version,
                    rolledBackTo: version
                }
            });
        } catch (error) {
            logger.error('Error during rollback:', error);
            throw error;
        }
    }

    async stopDeployment(deploymentId) {
        try {
            const deployment = await Deployment.findByPk(deploymentId);
            if (!deployment) {
                throw new Error(`Deployment ${deploymentId} not found`);
            }

            // Stop monitoring
            await monitoringService.stopMonitoring(deploymentId);

            if (deployment.containerId) {
                await dockerService.stopContainer(deployment.containerId);
                await dockerService.removeContainer(deployment.containerId);
            }

            await this._updateDeploymentStatus(deploymentId, 'stopped');
            return deployment;
        } catch (error) {
            logger.error('Error stopping deployment:', error);
            throw error;
        }
    }

    async getDeployment(deploymentId) {
        try {
            const deployment = await Deployment.findByPk(deploymentId);
            if (!deployment) {
                throw new Error(`Deployment ${deploymentId} not found`);
            }

            if (deployment.containerId) {
                const stats = await dockerService.getContainerStats(deployment.containerId);
                deployment.setDataValue('stats', stats);
            }

            return deployment;
        } catch (error) {
            logger.error('Error getting deployment:', error);
            throw error;
        }
    }

    async getDeploymentHistory(projectName, limit = 10) {
        try {
            return await Deployment.findAll({
                where: { projectName },
                order: [['createdAt', 'DESC']],
                limit
            });
        } catch (error) {
            logger.error('Error getting deployment history:', error);
            throw error;
        }
    }

    async scaleDeployment(deploymentId, replicas) {
        try {
            // Get the deployment
            const deployment = await this.getDeployment(deploymentId);
            if (!deployment) {
                throw new Error('Deployment not found');
            }

            if (deployment.status !== 'running') {
                throw new Error('Can only scale running deployments');
            }

            const oldReplicas = deployment.replicas || 1;
            deployment.replicas = replicas;
            deployment.status = 'scaling';
            await deployment.save();

            // Scale up: Create new containers
            if (replicas > oldReplicas) {
                const containersToAdd = replicas - oldReplicas;
                const promises = [];

                for (let i = 0; i < containersToAdd; i++) {
                    promises.push(this.createDeploymentContainer(deployment));
                }

                await Promise.all(promises);
            }
            // Scale down: Remove excess containers
            else if (replicas < oldReplicas) {
                const containersToRemove = oldReplicas - replicas;
                const containers = await this.dockerService.listContainers({
                    filters: {
                        label: [
                            `noderoll.deploymentId=${deploymentId}`,
                            'noderoll.managed=true'
                        ]
                    }
                });

                // Sort by creation time, remove newest first
                containers.sort((a, b) => b.Created - a.Created);
                const removePromises = containers
                    .slice(0, containersToRemove)
                    .map(container => this.dockerService.removeContainer(container.Id, { force: true }));

                await Promise.all(removePromises);
            }

            // Update deployment status
            deployment.status = 'running';
            await deployment.save();

            return deployment;
        } catch (error) {
            console.error('Error scaling deployment:', error);
            throw error;
        }
    }

    async createDeploymentContainer(deployment) {
        try {
            // Get base container configuration
            const containerConfig = await this.getContainerConfig(deployment);

            // Create and start container
            const container = await this.dockerService.createContainer(containerConfig);
            await this.dockerService.startContainer(container.id);

            return container;
        } catch (error) {
            console.error('Error creating deployment container:', error);
            throw error;
        }
    }

    async _processDeployment(deployment) {
        try {
            await this._updateDeploymentStatus(deployment.id, 'deploying');

            // Create container
            const container = await this.createDeploymentContainer(deployment);
            
            // Start container
            await dockerService.startContainer(container.id);
            
            // Start monitoring
            await monitoringService.startMonitoring(deployment.id, container.id);

            await this._updateDeploymentStatus(deployment.id, 'running', {
                containerId: container.id
            });

            logger.info(`Deployment successful for ${deployment.projectName}:${deployment.version}`);
        } catch (error) {
            logger.error(`Deployment failed for ${deployment.projectName}:${deployment.version}`, error);
            await this._updateDeploymentStatus(deployment.id, 'failed', {
                error: error.message
            });
            throw error;
        }
    }

    async getDeploymentStatus(deploymentId) {
        try {
            const deployment = await Deployment.findByPk(deploymentId);
            if (!deployment) {
                throw new Error(`Deployment ${deploymentId} not found`);
            }

            if (deployment.status !== 'running' || !deployment.containerId) {
                return {
                    status: deployment.status,
                    error: deployment.error
                };
            }

            const status = await monitoringService.getStatus(deploymentId);
            const metrics = await monitoringService.getMetrics(deploymentId);

            return {
                status: deployment.status,
                containerStatus: status,
                metrics,
                error: deployment.error
            };
        } catch (error) {
            logger.error(`Error getting deployment status for ${deploymentId}:`, error);
            throw error;
        }
    }

    async _updateDeploymentStatus(deploymentId, status, updates = {}) {
        try {
            await Deployment.update(
                { status, ...updates },
                { where: { id: deploymentId } }
            );
        } catch (error) {
            logger.error('Error updating deployment status:', error);
            throw error;
        }
    }

    async _handleHealthAlert(alert) {
        const { deploymentId, status } = alert;
        logger.warn(`Health alert for deployment ${deploymentId}:`, status);

        // Update deployment status
        await this._updateDeploymentStatus(deploymentId, 'unhealthy', {
            healthStatus: status
        });

        // TODO: Implement auto-recovery logic here
    }

    async _handleMetricsUpdate(update) {
        const { deploymentId, metrics } = update;
        
        try {
            const deployment = await Deployment.findByPk(deploymentId);
            if (deployment) {
                deployment.lastMetrics = metrics;
                await deployment.save();
            }
        } catch (error) {
            logger.error(`Error updating metrics for ${deploymentId}:`, error);
        }
    }

    _generateVersion() {
        return `v${Math.floor(Date.now() / 1000)}-${uuidv4().substr(0, 8)}`;
    }
}

module.exports = new DeploymentService();
