const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const deploymentHandler = require('../handlers/deployment.handler');

// Event handling
router.post('/events/:event', asyncHandler(async (req, res) => {
    const { event } = req.params;
    const result = await deploymentHandler.handleDeployment(event, req.body);
    res.json(result);
}));

// Deployment logs
router.get('/deployments/:deploymentId/logs', asyncHandler(async (req, res) => {
    const { deploymentId } = req.params;
    const logs = await deploymentHandler.getDeploymentLogs(deploymentId);
    res.json({ logs });
}));

// Cancel deployment
router.post('/deployments/:deploymentId/cancel', asyncHandler(async (req, res) => {
    const { deploymentId } = req.params;
    const result = await deploymentHandler.cancelDeployment(deploymentId);
    res.json(result);
}));

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
