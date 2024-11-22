const FileDeploymentStrategy = require('./file.strategy');
const DockerDeploymentStrategy = require('./docker.strategy');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class DeploymentService {
    constructor() {
        this.strategies = {
            'file': FileDeploymentStrategy,
            'docker': DockerDeploymentStrategy
        };
    }

    async deploy(deployment, project) {
        const strategyType = deployment.config?.type || 'docker';
        const Strategy = this.strategies[strategyType];

        if (!Strategy) {
            throw new AppError(400, `Unsupported deployment type: ${strategyType}`);
        }

        const strategy = new Strategy(deployment, project);
        logger.info(`Starting ${strategyType} deployment for project ${project.name}`);

        try {
            const result = await strategy.deploy();
            logger.info(`Successfully deployed ${project.name} using ${strategyType} strategy`);
            return result;
        } catch (error) {
            logger.error(`Deployment failed for ${project.name}:`, error);
            throw error;
        }
    }

    async stop(deployment, project) {
        const strategyType = deployment.config?.type || 'docker';
        const Strategy = this.strategies[strategyType];

        if (!Strategy) {
            throw new AppError(400, `Unsupported deployment type: ${strategyType}`);
        }

        const strategy = new Strategy(deployment, project);
        return await strategy.stop();
    }

    async rollback(deployment, project) {
        const strategyType = deployment.config?.type || 'docker';
        const Strategy = this.strategies[strategyType];

        if (!Strategy) {
            throw new AppError(400, `Unsupported deployment type: ${strategyType}`);
        }

        const strategy = new Strategy(deployment, project);
        return await strategy.rollback();
    }

    async getLogs(deployment, project, options = {}) {
        const strategyType = deployment.config?.type || 'docker';
        const Strategy = this.strategies[strategyType];

        if (!Strategy) {
            throw new AppError(400, `Unsupported deployment type: ${strategyType}`);
        }

        const strategy = new Strategy(deployment, project);
        return await strategy.getLogs(options);
    }

    async cleanup(deployment, project) {
        const strategyType = deployment.config?.type || 'docker';
        const Strategy = this.strategies[strategyType];

        if (!Strategy) {
            throw new AppError(400, `Unsupported deployment type: ${strategyType}`);
        }

        const strategy = new Strategy(deployment, project);
        return await strategy.cleanup();
    }

    async checkHealth(deployment, project) {
        const strategyType = deployment.config?.type || 'docker';
        const Strategy = this.strategies[strategyType];

        if (!Strategy) {
            throw new AppError(400, `Unsupported deployment type: ${strategyType}`);
        }

        const strategy = new Strategy(deployment, project);
        return await strategy.performHealthCheck();
    }

    getAvailableStrategies() {
        return Object.keys(this.strategies);
    }

    validateDeploymentConfig(config) {
        const strategyType = config?.type || 'docker';
        const Strategy = this.strategies[strategyType];

        if (!Strategy) {
            throw new AppError(400, `Unsupported deployment type: ${strategyType}`);
        }

        const strategy = new Strategy();
        return strategy.validateConfig(config);
    }
}

module.exports = new DeploymentService();
