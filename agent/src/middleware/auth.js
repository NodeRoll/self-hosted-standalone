const logger = require('../utils/logger');

const validateApiToken = (req, res, next) => {
    // Skip validation for health check
    if (req.path === '/health') {
        return next();
    }

    const apiToken = req.headers['x-api-token'];
    const expectedToken = process.env.API_TOKEN;

    if (!expectedToken) {
        logger.error('API_TOKEN is not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiToken) {
        return res.status(401).json({ error: 'API token is required' });
    }

    if (apiToken !== expectedToken) {
        logger.warn('Invalid API token received');
        return res.status(401).json({ error: 'Invalid API token' });
    }

    next();
};

module.exports = {
    validateApiToken
};
