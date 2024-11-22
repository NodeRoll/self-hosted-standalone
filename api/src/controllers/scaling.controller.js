const { Deployment } = require('../models');
const AutoScalingService = require('../services/auto-scaling.service');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

class ScalingController {
    async getScalingRules(req, res, next) {
        try {
            const { deploymentId } = req.params;
            const deployment = await Deployment.findByPk(deploymentId);

            if (!deployment) {
                throw new AppError(404, 'Deployment not found');
            }

            const rules = {
                minInstances: deployment.minInstances,
                maxInstances: deployment.maxInstances,
                cooldownPeriod: deployment.cooldownPeriod,
                rules: deployment.rules
            };

            res.json(rules);
        } catch (error) {
            next(error);
        }
    }

    async setScalingRules(req, res, next) {
        try {
            const { deploymentId } = req.params;
            const { minInstances, maxInstances, cooldownPeriod, rules } = req.body;

            const deployment = await Deployment.findByPk(deploymentId);
            if (!deployment) {
                throw new AppError(404, 'Deployment not found');
            }

            // Validate rules
            this._validateScalingRules(minInstances, maxInstances, cooldownPeriod, rules);

            // Update deployment with new rules
            await deployment.update({
                minInstances,
                maxInstances,
                cooldownPeriod,
                rules,
                lastScalingAction: null // Reset last scaling action
            });

            logger.info(`Updated scaling rules for deployment ${deploymentId}`);
            res.json({ message: 'Scaling rules updated successfully' });
        } catch (error) {
            next(error);
        }
    }

    async deleteScalingRules(req, res, next) {
        try {
            const { deploymentId } = req.params;
            const deployment = await Deployment.findByPk(deploymentId);

            if (!deployment) {
                throw new AppError(404, 'Deployment not found');
            }

            // Reset scaling rules to defaults
            await deployment.update({
                minInstances: 1,
                maxInstances: 5,
                cooldownPeriod: 300000,
                rules: [],
                lastScalingAction: null
            });

            logger.info(`Removed scaling rules for deployment ${deploymentId}`);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async evaluateScaling(req, res, next) {
        try {
            const { deploymentId } = req.params;
            
            const decision = await AutoScalingService.evaluateScalingRules(deploymentId);
            if (!decision) {
                return res.json({ message: 'No scaling action needed' });
            }

            res.json({
                message: 'Scaling evaluation complete',
                decision
            });
        } catch (error) {
            next(error);
        }
    }

    _validateScalingRules(minInstances, maxInstances, cooldownPeriod, rules) {
        if (minInstances < 1) {
            throw new AppError(400, 'Minimum instances must be at least 1');
        }

        if (maxInstances < minInstances) {
            throw new AppError(400, 'Maximum instances must be greater than or equal to minimum instances');
        }

        if (cooldownPeriod < 60000) { // 1 minute minimum
            throw new AppError(400, 'Cooldown period must be at least 60000ms (1 minute)');
        }

        if (!Array.isArray(rules)) {
            throw new AppError(400, 'Rules must be an array');
        }

        // Validate each rule
        rules.forEach(rule => {
            if (!rule.type || !rule.threshold || !rule.action) {
                throw new AppError(400, 'Each rule must have type, threshold, and action');
            }

            if (!['scale-up', 'scale-down'].includes(rule.action)) {
                throw new AppError(400, 'Rule action must be either scale-up or scale-down');
            }

            const validTypes = [
                'cpu', 'memory', 'disk', 'network',
                'github_commitFrequency', 'github_activePRs', 'github_trafficLoad'
            ];

            if (!validTypes.includes(rule.type)) {
                throw new AppError(400, `Invalid metric type. Must be one of: ${validTypes.join(', ')}`);
            }
        });
    }
}

module.exports = new ScalingController();
