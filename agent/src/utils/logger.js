const winston = require('winston');
const path = require('path');

const logDir = process.env.LOG_DIR || 'logs';
const logLevel = process.env.LOG_LEVEL || 'info';

// Create logger instance
const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // File transport for errors
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error'
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log')
        })
    ]
});

// Create deployment-specific logger
const createDeploymentLogger = (deploymentId) => {
    const deploymentLogger = winston.createLogger({
        level: logLevel,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        defaultMeta: { deploymentId },
        transports: [
            new winston.transports.File({
                filename: path.join(logDir, `deployment-${deploymentId}.log`)
            })
        ]
    });

    return deploymentLogger;
};

module.exports = {
    ...logger,
    createDeploymentLogger
};
