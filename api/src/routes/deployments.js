const express = require('express');
const router = express.Router();
const deploymentService = require('../services/deploymentService');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

// Create new deployment
router.post('/',
    [
        body('projectName').notEmpty().trim(),
        body('environment').optional().isObject(),
        body('config').optional().isObject(),
        body('resources').optional().isObject(),
        body('version').optional().isString()
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const deployment = await deploymentService.createDeployment(
                req.body.projectName,
                {
                    version: req.body.version,
                    environment: req.body.environment,
                    config: req.body.config,
                    resources: req.body.resources,
                    deployedBy: req.user?.id
                }
            );
            res.status(201).json(deployment);
        } catch (error) {
            next(error);
        }
    }
);

// Get deployment by ID
router.get('/:id',
    [param('id').isUUID()],
    validateRequest,
    async (req, res, next) => {
        try {
            const deployment = await deploymentService.getDeployment(req.params.id);
            res.json(deployment);
        } catch (error) {
            next(error);
        }
    }
);

// Get deployment history
router.get('/project/:projectName/history',
    [
        param('projectName').notEmpty().trim(),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const history = await deploymentService.getDeploymentHistory(
                req.params.projectName,
                req.query.limit
            );
            res.json(history);
        } catch (error) {
            next(error);
        }
    }
);

// Rollback deployment
router.post('/rollback',
    [
        body('projectName').notEmpty().trim(),
        body('version').notEmpty().trim()
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const deployment = await deploymentService.rollback(
                req.body.projectName,
                req.body.version
            );
            res.status(201).json(deployment);
        } catch (error) {
            next(error);
        }
    }
);

// Stop deployment
router.post('/:id/stop',
    [param('id').isUUID()],
    validateRequest,
    async (req, res, next) => {
        try {
            const deployment = await deploymentService.stopDeployment(req.params.id);
            res.json(deployment);
        } catch (error) {
            next(error);
        }
    }
);

// Get deployment logs
router.get('/:id/logs',
    [
        param('id').isUUID(),
        query('tail').optional().isInt({ min: 1, max: 1000 })
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const deployment = await deploymentService.getDeployment(req.params.id);
            if (!deployment.containerId) {
                throw new Error('No active container for this deployment');
            }

            const logs = await dockerService.getContainerLogs(deployment.containerId, {
                tail: req.query.tail || 100
            });
            res.send(logs);
        } catch (error) {
            next(error);
        }
    }
);

// Scale deployment
router.post('/:id/scale', [
    param('id').isUUID().withMessage('Invalid deployment ID'),
    body('replicas').isInt({ min: 0 }).withMessage('Replicas must be a non-negative integer')
], async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const deploymentId = req.params.id;
        const { replicas } = req.body;

        // Scale the deployment
        const deployment = await deploymentService.scaleDeployment(deploymentId, replicas);

        res.json(deployment);
    } catch (error) {
        console.error('Error scaling deployment:', error);
        res.status(500).json({
            message: error.message || 'Failed to scale deployment'
        });
    }
});

module.exports = router;
