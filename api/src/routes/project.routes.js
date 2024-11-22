const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, isAdmin, canAccessProject } = require('../middleware/auth.middleware');

// Project CRUD routes
router.post('/', authenticate, projectController.create);
router.get('/', authenticate, projectController.list);
router.get('/:projectId', authenticate, canAccessProject, projectController.get);
router.put('/:projectId', authenticate, canAccessProject, projectController.update);
router.delete('/:projectId', authenticate, canAccessProject, projectController.delete);

// Collaborator management routes
router.post('/:projectId/collaborators', authenticate, canAccessProject, projectController.addCollaborator);
router.delete('/:projectId/collaborators/:userId', authenticate, canAccessProject, projectController.removeCollaborator);

module.exports = router;
