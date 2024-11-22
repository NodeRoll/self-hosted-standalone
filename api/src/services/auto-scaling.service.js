const logger = require('../utils/logger');
const GitHubService = require('./github.service');
const { Deployment } = require('../models');
const os = require('os');

class AutoScalingService {
    constructor() {
        this.githubService = new GitHubService();
    }

    async evaluateScalingRules(deploymentId) {
        try {
            const deployment = await Deployment.findByPk(deploymentId, {
                include: ['project', 'scalingRules']
            });

            if (!deployment || !deployment.scalingRules) {
                logger.debug(`No scaling rules found for deployment ${deploymentId}`);
                return null;
            }

            // Check cooldown period
            if (deployment.lastScalingAction) {
                const cooldownEnd = new Date(deployment.lastScalingAction.getTime() + deployment.cooldownPeriod);
                if (cooldownEnd > new Date()) {
                    logger.debug(`Cooling down for deployment ${deploymentId}`);
                    return null;
                }
            }

            const metrics = await this._gatherMetrics(deployment);
            return this._evaluateMetrics(metrics, deployment);
        } catch (error) {
            logger.error('Error evaluating scaling rules:', error);
            throw error;
        }
    }

    async _gatherMetrics(deployment) {
        const metrics = {
            system: await this._getSystemMetrics(),
            github: await this._getGitHubMetrics(deployment)
        };

        return metrics;
    }

    async _getSystemMetrics() {
        // Get system metrics from the host machine
        const cpuUsage = os.loadavg()[0] * 100; // 1 minute load average
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

        return {
            cpu: Math.round(cpuUsage),
            memory: Math.round(memoryUsage)
        };
    }

    async _getGitHubMetrics(deployment) {
        try {
            const { project } = deployment;
            if (!project || !project.githubToken) {
                return null;
            }

            const [owner, repo] = project.githubRepo.split('/');
            
            // Get GitHub traffic load
            const trafficLoad = await this.githubService._calculateTrafficLoad(
                project.githubToken,
                owner,
                repo
            );

            return {
                trafficLoad: trafficLoad.loadScore
            };

        } catch (error) {
            logger.error('Error gathering GitHub metrics:', error);
            return null;
        }
    }

    _evaluateMetrics(metrics, deployment) {
        const currentInstances = deployment.instances || 1;
        let shouldScale = false;
        let newInstanceCount = currentInstances;

        // Check system resources first
        if (metrics.system.cpu > 80 || metrics.system.memory > 80) {
            logger.warn(`High system load detected: CPU ${metrics.system.cpu}%, Memory ${metrics.system.memory}%`);
            return {
                action: 'warning',
                message: 'System resources are running high. Consider upgrading your server.',
                metrics: metrics.system
            };
        }

        // Evaluate GitHub traffic
        if (metrics.github && metrics.github.trafficLoad > 80) {
            if (currentInstances < deployment.maxInstances) {
                shouldScale = true;
                newInstanceCount = Math.min(currentInstances + 1, deployment.maxInstances);
            }
        } else if (metrics.github && metrics.github.trafficLoad < 20) {
            if (currentInstances > deployment.minInstances) {
                shouldScale = true;
                newInstanceCount = Math.max(currentInstances - 1, deployment.minInstances);
            }
        }

        if (!shouldScale) {
            return null;
        }

        return {
            action: newInstanceCount > currentInstances ? 'scale-up' : 'scale-down',
            currentInstances,
            newInstanceCount,
            metrics: {
                system: metrics.system,
                github: metrics.github
            },
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new AutoScalingService();
