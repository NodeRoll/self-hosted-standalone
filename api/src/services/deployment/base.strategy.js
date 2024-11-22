class DeploymentStrategy {
    async validate() {
        throw new Error('validate() must be implemented');
    }

    async deploy() {
        throw new Error('deploy() must be implemented');
    }

    async rollback() {
        throw new Error('rollback() must be implemented');
    }

    async stop() {
        throw new Error('stop() must be implemented');
    }

    async getLogs() {
        throw new Error('getLogs() must be implemented');
    }

    async cleanup() {
        throw new Error('cleanup() must be implemented');
    }

    async checkHealth() {
        throw new Error('checkHealth() must be implemented');
    }
}

module.exports = DeploymentStrategy;
