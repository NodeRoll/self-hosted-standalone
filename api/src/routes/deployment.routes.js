const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deployment.controller');
const { auth, requireProjectAccess } = require('../middleware/auth.middleware');
const { validateAgentRequest } = require('../middleware/agent.middleware');

// Project deployment routes
router.post('/projects/:projectId/deployments', auth, requireProjectAccess, deploymentController.create);
router.get('/projects/:projectId/deployments', auth, requireProjectAccess, deploymentController.list);
router.get('/projects/:projectId/deployments/:deploymentId', auth, requireProjectAccess, deploymentController.get);
router.post('/projects/:projectId/deployments/:deploymentId/cancel', auth, requireProjectAccess, deploymentController.cancel);
router.post('/projects/:projectId/deployments/:deploymentId/rollback', auth, requireProjectAccess, deploymentController.rollback);

// Agent webhook routes
router.post('/deployments/:deploymentId/status', validateAgentRequest, deploymentController.updateStatus);

module.exports = router;
