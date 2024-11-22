const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await authService.register(email, password, name);
        res.status(201).json(result);
    } catch (error) {
        logger.error('Registration error:', error);
        if (error.message === 'User already exists') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        logger.error('Login error:', error);
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: error.message });
        }
        res.status(500).json({ error: 'Login failed' });
    }
});

// Generate new API token
router.post('/tokens', authenticate, async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'Token description is required' });
        }

        const token = await authService.generateApiToken(req.user.id, description);
        res.json({ token });
    } catch (error) {
        logger.error('API token generation error:', error);
        res.status(500).json({ error: 'Failed to generate API token' });
    }
});

// List API tokens
router.get('/tokens', authenticate, async (req, res) => {
    try {
        const user = await authService.validateApiToken(req.user.id);
        res.json({ tokens: user.apiTokens });
    } catch (error) {
        logger.error('Error fetching API tokens:', error);
        res.status(500).json({ error: 'Failed to fetch API tokens' });
    }
});

// Revoke API token
router.delete('/tokens/:tokenId', authenticate, async (req, res) => {
    try {
        const { tokenId } = req.params;
        await authService.revokeApiToken(req.user.id, tokenId);
        res.status(204).send();
    } catch (error) {
        logger.error('Error revoking API token:', error);
        res.status(500).json({ error: 'Failed to revoke API token' });
    }
});

module.exports = router;
