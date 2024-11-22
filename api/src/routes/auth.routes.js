const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');

// GitHub OAuth callback
router.get('/github/callback', authController.githubCallback);

// Get current user info
router.get('/me', auth, authController.getCurrentUser);

// Logout
router.post('/logout', auth, authController.logout);

module.exports = router;
