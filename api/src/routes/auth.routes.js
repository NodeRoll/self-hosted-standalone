const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');

// Local authentication
router.post('/register', authController.register);
router.post('/login', authController.login);

// GitHub OAuth
router.get('/github/callback', authController.githubCallback);

// API Token management
router.post('/tokens', auth, authController.generateApiToken);
router.get('/tokens', auth, authController.listApiTokens);
router.delete('/tokens/:tokenId', auth, authController.revokeApiToken);

// User management
router.get('/me', auth, authController.getCurrentUser);
router.post('/logout', auth, authController.logout);

module.exports = router;
