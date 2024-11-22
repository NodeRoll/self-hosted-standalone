const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deployment.controller');
const { authenticate, canAccessProject } = require('../middleware/auth.middleware');
const { validateAgentRequest } = require('../middleware/agent.middleware');

// Project deployment routes
router.post('/projects/:projectId/deployments', authenticate, canAccessProject, deploymentController.create);
router.get('/projects/:projectId/deployments', authenticate, canAccessProject, deploymentController.list);
router.get('/projects/:projectId/deployments/:deploymentId', authenticate, canAccessProject, deploymentController.get);
router.post('/projects/:projectId/deployments/:deploymentId/cancel', authenticate, canAccessProject, deploymentController.cancel);
router.post('/projects/:projectId/deployments/:deploymentId/rollback', authenticate, canAccessProject, deploymentController.rollback);

// Agent webhook routes
router.post('/deployments/:deploymentId/status', validateAgentRequest, deploymentController.updateStatus);

module.exports = router;
