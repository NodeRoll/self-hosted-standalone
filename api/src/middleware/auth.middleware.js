const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { AppError } = require('./errorHandler');
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

const auth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            throw new AppError(401, 'Authentication required');
        }

        // First try JWT token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) {
                throw new AppError(401, 'User not found');
            }
            req.user = user;
            return next();
        } catch (jwtError) {
            // If JWT verification fails, try API token
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const user = await User.findOne({
                'apiTokens.token': hashedToken
            });

            if (!user) {
                throw new AppError(401, 'Invalid authentication token');
            }

            req.user = user;
            return next();
        }
    } catch (error) {
        logger.error('Authentication error:', error);
        next(error);
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        throw new AppError(403, 'Admin access required');
    }
    next();
};

module.exports = {
    auth,
    requireAdmin
};
