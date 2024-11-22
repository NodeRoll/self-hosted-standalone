const express = require('express');
const router = express.Router();
const deploymentService = require('../services/deploymentService');
const autoScalingService = require('../services/autoScalingService');
const { auth, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// Create new deployment
router.post('/', auth, async (req, res, next) => {
    try {
        const deployment = await deploymentService.createDeployment(
            req.body.projectName,
            {
                ...req.body,
                deployedBy: req.user.id
            }
        );
        res.status(201).json(deployment);
    } catch (error) {
        next(error);
    }
});

// Get deployment status with metrics
router.get('/:id/status', auth, async (req, res, next) => {
    try {
        const status = await deploymentService.getDeploymentStatus(req.params.id);
        res.json(status);
    } catch (error) {
        next(error);
    }
});

// Get deployment metrics history
router.get('/:id/metrics', auth, async (req, res, next) => {
    try {
        const metrics = await deploymentService.getDeploymentMetrics(
            req.params.id,
            req.query.from,
            req.query.to
        );
        res.json(metrics);
    } catch (error) {
        next(error);
    }
});

// Scale deployment
router.post('/:id/scale', auth, async (req, res, next) => {
    try {
        const { replicas } = req.body;
        if (!replicas || replicas < 1) {
            return res.status(400).json({ error: 'Invalid replicas count' });
        }

        const deployment = await deploymentService.scaleDeployment(
            req.params.id,
            replicas
        );
        res.json(deployment);
    } catch (error) {
        next(error);
    }
});

// Stop deployment
router.post('/:id/stop', auth, async (req, res, next) => {
    try {
        const deployment = await deploymentService.stopDeployment(req.params.id);
        res.json(deployment);
    } catch (error) {
        next(error);
    }
});

// Restart deployment
router.post('/:id/restart', auth, async (req, res, next) => {
    try {
        const deployment = await deploymentService.restartDeployment(req.params.id);
        res.json(deployment);
    } catch (error) {
        next(error);
    }
});

// Rollback deployment
router.post('/:id/rollback', auth, async (req, res, next) => {
    try {
        const deployment = await deploymentService.rollbackDeployment(
            req.params.id,
            req.body.version
        );
        res.json(deployment);
    } catch (error) {
        next(error);
    }
});

// Get deployment logs
router.get('/:id/logs', auth, async (req, res, next) => {
    try {
        const logs = await deploymentService.getDeploymentLogs(
            req.params.id,
            req.query.since,
            req.query.tail
        );
        res.json(logs);
    } catch (error) {
        next(error);
    }
});

// List deployments
router.get('/', auth, async (req, res, next) => {
    try {
        const deployments = await deploymentService.listDeployments(
            req.query.projectName,
            req.query.status,
            req.query.page,
            req.query.limit
        );
        res.json(deployments);
    } catch (error) {
        next(error);
    }
});

// Get deployment by ID
router.get('/:id', auth, async (req, res, next) => {
    try {
        const deployment = await deploymentService.getDeployment(req.params.id);
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }
        res.json(deployment);
    } catch (error) {
        next(error);
    }
});

// Get auto-scaling rules
router.get('/:id/scaling-rules', auth, async (req, res, next) => {
    try {
        const rules = await autoScalingService.getScalingRules(req.params.id);
        if (!rules) {
            return res.status(404).json({ message: 'No scaling rules found for this deployment' });
        }
        res.json(rules);
    } catch (error) {
        next(error);
    }
});

// Set auto-scaling rules
router.post('/:id/scaling-rules', auth, async (req, res, next) => {
    try {
        const { minInstances, maxInstances, metrics, cooldownPeriod } = req.body;
        
        // Set scaling rules
        await autoScalingService.setScalingRules(req.params.id, {
            minInstances,
            maxInstances,
            metrics,
            cooldownPeriod
        });
        
        res.json({ message: 'Auto-scaling rules updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Delete auto-scaling rules
router.delete('/:id/scaling-rules', auth, async (req, res, next) => {
    try {
        await autoScalingService.removeScalingRules(req.params.id);
        res.json({ message: 'Auto-scaling rules removed successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
