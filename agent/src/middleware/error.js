const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Error:', err.message);
    logger.error('Stack:', err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.message
        });
    }

    if (err.name === 'DeploymentError') {
        return res.status(400).json({
            error: 'Deployment error',
            details: err.message
        });
    }

    // Default error
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
};

const notFoundHandler = (req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
