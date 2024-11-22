const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { auth, requireAdmin, requireProjectAccess } = require('../middleware/auth.middleware');

// Project CRUD routes
router.post('/', auth, projectController.create);
router.get('/', auth, projectController.list);
router.get('/:projectId', auth, requireProjectAccess, projectController.get);
router.put('/:projectId', auth, requireProjectAccess, projectController.update);
router.delete('/:projectId', auth, requireProjectAccess, projectController.delete);

// Collaborator management routes
router.post('/:projectId/collaborators', auth, requireProjectAccess, projectController.addCollaborator);
router.delete('/:projectId/collaborators/:userId', auth, requireProjectAccess, projectController.removeCollaborator);

module.exports = router;
