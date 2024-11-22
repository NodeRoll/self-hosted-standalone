const authService = require('../services/authService');
const logger = require('../utils/logger');

const extractToken = (req) => {
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    if (req.headers['x-api-key']) {
        return req.headers['x-api-key'];
    }
    return null;
};

const authenticate = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // First try JWT token
        const jwtPayload = authService.verifyJWT(token);
        if (jwtPayload) {
            req.user = jwtPayload;
            return next();
        }

        // Then try API token
        const user = await authService.validateApiToken(token);
        if (user) {
            req.user = user;
            return next();
        }

        res.status(401).json({ error: 'Invalid authentication token' });
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = {
    authenticate,
    requireAdmin
};
