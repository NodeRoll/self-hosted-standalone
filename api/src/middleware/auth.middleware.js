const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { User } = require('../models');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new AppError(401, 'Authentication required');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            throw new AppError(401, 'User not found');
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new AppError(401, 'Invalid token'));
        } else {
            next(error);
        }
    }
};

const requireAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AppError(403, 'Admin access required');
        }
        next();
    } catch (error) {
        next(error);
    }
};

const requireProjectAccess = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const user = req.user;

        // Admin can access all projects
        if (user.role === 'admin') {
            return next();
        }

        // Find project
        const project = await user.getProjects({
            where: { id: projectId }
        });

        if (!project || project.length === 0) {
            throw new AppError(403, 'Project access denied');
        }

        // Add project to request
        req.project = project[0];
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    auth,
    requireAdmin,
    requireProjectAccess
};
