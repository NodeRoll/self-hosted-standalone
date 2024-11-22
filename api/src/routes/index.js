const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const projectRoutes = require('./project.routes');
const deploymentRoutes = require('./deployment.routes');
const agentRoutes = require('./agent.routes');

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running'
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/agents', agentRoutes);

module.exports = router;
