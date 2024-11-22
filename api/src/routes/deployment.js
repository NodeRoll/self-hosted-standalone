const express = require('express');
const router = express.Router();
const deploymentService = require('../services/deployment');
const autoScalingService = require('../services/autoscaling');
const { AppError } = require('../middleware/errorHandler');
const { validateSchema } = require('../middleware/validation');
const logger = require('../utils/logger');

// Deployment schemas
const deploymentSchema = {
    type: 'object',
    required: ['config'],
    properties: {
        config: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['docker', 'file'] },
                process: {
                    type: 'object',
                    properties: {
                        instances: { type: 'number', minimum: 1 },
                        maxMemory: { type: 'string' },
                        script: { type: 'string' }
                    }
                },
                env: { type: 'object' }
            }
        }
    }
};

const scalingRuleSchema = {
    type: 'object',
    required: ['metric', 'operator', 'threshold', 'action', 'instances'],
    properties: {
        metric: { type: 'string', enum: ['cpu', 'memory', 'requests'] },
        operator: { type: 'string', enum: ['>', '<', '>=', '<=', '=='] },
        threshold: { type: 'number', minimum: 0 },
        action: { type: 'string', enum: ['scale_up', 'scale_down'] },
        instances: {
            type: 'object',
            required: ['min', 'max'],
            properties: {
                min: { type: 'number', minimum: 1 },
                max: { type: 'number', minimum: 1 }
            }
        }
    }
};

// Deployment routes
router.post('/:projectId/deploy', validateSchema(deploymentSchema), async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const deployment = await deploymentService.deploy({
            projectId,
            config: req.body.config
        });

        res.status(201).json({
            success: true,
            data: deployment
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:projectId/rollback/:deploymentId', async (req, res, next) => {
    try {
        const { projectId, deploymentId } = req.params;
        const deployment = await deploymentService.rollback(deploymentId, projectId);

        res.json({
            success: true,
            data: deployment
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:projectId/stop/:deploymentId', async (req, res, next) => {
    try {
        const { projectId, deploymentId } = req.params;
        await deploymentService.stop(deploymentId, projectId);

        res.json({
            success: true,
            message: 'Deployment stopped successfully'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:projectId/logs/:deploymentId', async (req, res, next) => {
    try {
        const { projectId, deploymentId } = req.params;
        const { tail, error } = req.query;
        const logs = await deploymentService.getLogs(deploymentId, projectId, {
            tail: parseInt(tail) || undefined,
            error: error === 'true'
        });

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:projectId/health/:deploymentId', async (req, res, next) => {
    try {
        const { projectId, deploymentId } = req.params;
        const health = await deploymentService.checkHealth(deploymentId, projectId);

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        next(error);
    }
});

// Auto-scaling routes
router.post('/:projectId/scaling/:deploymentId', validateSchema(scalingRuleSchema), async (req, res, next) => {
    try {
        const { projectId, deploymentId } = req.params;
        await autoScalingService.addRule(projectId, req.body);

        res.json({
            success: true,
            message: 'Scaling rule added successfully'
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:projectId/scaling/:deploymentId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        await autoScalingService.removeRule(projectId);

        res.json({
            success: true,
            message: 'Scaling rule removed successfully'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:projectId/scaling/:deploymentId', async (req, res, next) => {
    try {
        const { projectId, deploymentId } = req.params;
        const deployment = await deploymentService.getDeployment(deploymentId, projectId);
        const rule = await deployment.getScalingRule();

        res.json({
            success: true,
            data: rule
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:projectId/metrics/:deploymentId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const metrics = await autoScalingService.getMetrics(projectId);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
