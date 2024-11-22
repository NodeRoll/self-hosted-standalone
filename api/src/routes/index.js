const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const projectRoutes = require('./project.routes');
const deploymentRoutes = require('./deployment.routes');
const agentRoutes = require('./agent.routes');

// Import scaling controller
const scalingController = require('../controllers/scaling.controller');

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running'
    });
});

// Auto-scaling routes
router.get('/deployments/:deploymentId/scaling-rules', scalingController.getScalingRules);
router.post('/deployments/:deploymentId/scaling-rules', scalingController.setScalingRules);
router.delete('/deployments/:deploymentId/scaling-rules', scalingController.deleteScalingRules);
router.get('/deployments/:deploymentId/scaling-evaluate', scalingController.evaluateScaling);

// Mount routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/agents', agentRoutes);

module.exports = router;
