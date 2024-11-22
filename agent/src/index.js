require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Graceful shutdown handler
const gracefulShutdown = () => {
    logger.info('Received shutdown signal. Starting graceful shutdown...');
    server.close(() => {
        logger.info('Server closed. Exiting process.');
        process.exit(0);
    });
};

// Start server
const server = app.listen(PORT, HOST, () => {
    logger.info(`NodeRoll Agent running on http://${HOST}:${PORT}`);
});

// Handle process signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
