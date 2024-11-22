const monitoringService = require('./monitoringService');
const deploymentService = require('./deploymentService');
const githubService = require('./github.service');
const logger = require('../utils/logger');
const { EventEmitter } = require('events');

class AutoScalingService extends EventEmitter {
    constructor() {
        super();
        this.scalingRules = new Map();
        this.CHECK_INTERVAL = 30000; // 30 seconds
    }

    setScalingRules(deploymentId, rules) {
        // Validate rules
        if (!this._validateRules(rules)) {
            throw new Error('Invalid scaling rules format');
        }

        this.scalingRules.set(deploymentId, {
            ...rules,
            lastScaleAction: Date.now(),
            cooldownPeriod: rules.cooldownPeriod || 300000 // 5 minutes default
        });

        // Start monitoring if not already started
        this._startScalingCheck(deploymentId);
    }

    getScalingRules(deploymentId) {
        return this.scalingRules.get(deploymentId);
    }

    removeScalingRules(deploymentId) {
        this.scalingRules.delete(deploymentId);
    }

    async _startScalingCheck(deploymentId) {
        const rules = this.scalingRules.get(deploymentId);
        if (!rules) return;

        while (this.scalingRules.has(deploymentId)) {
            try {
                await this._checkAndScale(deploymentId);
            } catch (error) {
                logger.error(`Error in scaling check for ${deploymentId}:`, error);
            }

            await new Promise(resolve => setTimeout(resolve, this.CHECK_INTERVAL));
        }
    }

    async _checkAndScale(deploymentId) {
        const rules = this.scalingRules.get(deploymentId);
        const deployment = await deploymentService.getDeployment(deploymentId);

        // Check cooldown period
        if (Date.now() - rules.lastScaleAction < rules.cooldownPeriod) {
            return;
        }

        // Get all metrics in parallel
        const [systemMetrics, githubMetrics] = await Promise.all([
            monitoringService.getMetrics(deploymentId),
            this._getGitHubMetrics(deployment)
        ]);

        // Check system metrics
        for (const metricRule of rules.metrics) {
            if (metricRule.type === 'cpu' || metricRule.type === 'memory') {
                const currentValue = this._getCurrentSystemMetricValue(systemMetrics, metricRule.type);
                if (this._shouldScale(currentValue, metricRule)) {
                    await this._performScaling(deploymentId, metricRule.action, rules);
                    rules.lastScaleAction = Date.now();
                    return;
                }
            }
        }

        // Check GitHub metrics if available
        if (githubMetrics) {
            for (const metricRule of rules.metrics) {
                const currentValue = this._getCurrentGitHubMetricValue(githubMetrics, metricRule.type);
                if (currentValue !== null && this._shouldScale(currentValue, metricRule)) {
                    await this._performScaling(deploymentId, metricRule.action, rules);
                    rules.lastScaleAction = Date.now();
                    return;
                }
            }
        }
    }

    async _getGitHubMetrics(deployment) {
        if (!deployment.githubRepo) {
            return null;
        }

        try {
            const [owner, repo] = deployment.githubRepo.split('/');
            return await githubService.getRepositoryMetrics(
                deployment.githubToken,
                owner,
                repo
            );
        } catch (error) {
            logger.warn(`Failed to get GitHub metrics for deployment ${deployment.id}:`, error);
            return null;
        }
    }

    _getCurrentSystemMetricValue(metrics, metricType) {
        switch (metricType) {
            case 'cpu':
                return metrics.cpu.current;
            case 'memory':
                return metrics.memory.current;
            default:
                return null;
        }
    }

    _getCurrentGitHubMetricValue(metrics, metricType) {
        switch (metricType) {
            case 'commit_frequency':
                return metrics.commitFrequency;
            case 'active_prs':
                return metrics.activePRs;
            case 'active_issues':
                return metrics.activeIssues;
            case 'traffic_load':
                return metrics.trafficLoad;
            default:
                return null;
        }
    }

    _shouldScale(currentValue, metricRule) {
        const { threshold, action } = metricRule;
        
        if (action === 'scale-up') {
            return currentValue > threshold;
        } else {
            return currentValue < threshold;
        }
    }

    async _performScaling(deploymentId, action, rules) {
        const deployment = await deploymentService.getDeployment(deploymentId);
        const currentInstances = deployment.instances || 1;
        let newInstances = currentInstances;

        if (action === 'scale-up' && currentInstances < rules.maxInstances) {
            newInstances = Math.min(currentInstances + 1, rules.maxInstances);
        } else if (action === 'scale-down' && currentInstances > rules.minInstances) {
            newInstances = Math.max(currentInstances - 1, rules.minInstances);
        }

        if (newInstances !== currentInstances) {
            await deploymentService.scaleDeployment(deploymentId, newInstances);
            logger.info(`Scaled deployment ${deploymentId} from ${currentInstances} to ${newInstances} instances`);
            this.emit('scaled', {
                deploymentId,
                previousInstances: currentInstances,
                newInstances,
                reason: action
            });
        }
    }

    _validateRules(rules) {
        const requiredFields = ['minInstances', 'maxInstances', 'metrics'];
        if (!requiredFields.every(field => field in rules)) {
            return false;
        }

        // Validate metrics rules
        const validMetrics = [
            'cpu', 'memory',
            'commit_frequency', 'active_prs',
            'active_issues', 'traffic_load'
        ];
        
        return rules.metrics.every(metric => {
            return (
                validMetrics.includes(metric.type) &&
                typeof metric.threshold === 'number' &&
                typeof metric.action === 'string' &&
                ['scale-up', 'scale-down'].includes(metric.action)
            );
        });
    }
}

module.exports = new AutoScalingService();
