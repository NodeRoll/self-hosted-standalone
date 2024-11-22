const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

const validateAgentRequest = (req, res, next) => {
    try {
        const agentToken = req.headers['x-agent-token'];
        
        if (!agentToken) {
            throw new AppError(401, 'Agent token is required');
        }

        if (agentToken !== process.env.AGENT_TOKEN) {
            logger.warn('Invalid agent token received');
            throw new AppError(401, 'Invalid agent token');
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    validateAgentRequest
};
