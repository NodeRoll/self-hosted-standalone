const fs = require('fs').promises;
const logger = require('../utils/logger');

class BaseDeployment {
    constructor(config) {
        this.deploymentId = config.deploymentId;
        this.projectId = config.projectId;
        this.deploymentDir = config.deploymentDir;
        this.envVars = config.envVars;
    }

    async deploy() {
        throw new Error('deploy() must be implemented');
    }

    async stop() {
        throw new Error('stop() must be implemented');
    }

    async getLogs() {
        throw new Error('getLogs() must be implemented');
    }

    async cleanup() {
        try {
            await fs.rm(this.deploymentDir, { recursive: true, force: true });
            return true;
        } catch (error) {
            logger.error('Failed to cleanup deployment directory:', error);
            return false;
        }
    }

    async isHealthy() {
        throw new Error('isHealthy() must be implemented');
    }

    async waitForHealthy() {
        throw new Error('waitForHealthy() must be implemented');
    }
}

module.exports = BaseDeployment;
