class DeploymentStrategy {
    constructor() {
        if (this.constructor === DeploymentStrategy) {
            throw new Error('Abstract class cannot be instantiated');
        }
        this.healthCheckInterval = null;
        this.metrics = {};
    }

    async validate() {
        // 1. Check workspace directory
        await this.validateWorkspace();
        
        // 2. Check required files
        await this.validateRequiredFiles();
        
        // 3. Check resource requirements
        await this.validateResources();
        
        // 4. Validate configuration
        await this.validateConfig();
    }

    async validateWorkspace() {
        if (!this.workDir) {
            throw new Error('Workspace directory not set');
        }
        try {
            await fs.access(this.workDir);
        } catch {
            throw new Error(`Workspace directory ${this.workDir} does not exist`);
        }
    }

    async validateRequiredFiles() {
        throw new Error('validateRequiredFiles() must be implemented');
    }

    async validateResources() {
        const { memory, cpus, storage } = this.deployment.resourceLimits || {};
        
        if (!memory || !cpus || !storage) {
            throw new Error('Resource limits not properly configured');
        }

        // Check available resources
        const systemMemory = os.totalmem();
        const systemCPUs = os.cpus().length;
        
        if (memory > systemMemory * 0.8) {
            throw new Error('Requested memory exceeds system capacity');
        }
        
        if (cpus > systemCPUs) {
            throw new Error('Requested CPU count exceeds system capacity');
        }
    }

    async validateConfig(config) {
        // Validate basic configuration
        if (!config) {
            throw new AppError(400, 'Configuration is required');
        }

        // Validate scaling configuration if present
        if (config.scaling) {
            await this.validateScalingConfig(config.scaling);
        }

        return true;
    }

    async validateScalingConfig(scaling) {
        const validMetrics = ['cpu', 'memory', 'requests'];
        const validOperators = ['>', '<', '>=', '<=', '=='];

        if (!scaling.metric || !validMetrics.includes(scaling.metric)) {
            throw new AppError(400, `Invalid scaling metric. Must be one of: ${validMetrics.join(', ')}`);
        }

        if (!scaling.operator || !validOperators.includes(scaling.operator)) {
            throw new AppError(400, `Invalid scaling operator. Must be one of: ${validOperators.join(', ')}`);
        }

        if (typeof scaling.threshold !== 'number' || scaling.threshold < 0) {
            throw new AppError(400, 'Invalid scaling threshold. Must be a positive number');
        }

        if (!scaling.action || !['scale_up', 'scale_down'].includes(scaling.action)) {
            throw new AppError(400, 'Invalid scaling action. Must be either scale_up or scale_down');
        }

        if (typeof scaling.instances !== 'object' || 
            typeof scaling.instances.min !== 'number' || 
            typeof scaling.instances.max !== 'number' || 
            scaling.instances.min < 1 || 
            scaling.instances.max < scaling.instances.min) {
            throw new AppError(400, 'Invalid scaling instances configuration');
        }
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

    async getLogs(options = {}) {
        throw new Error('getLogs() must be implemented');
    }

    async cleanup() {
        // Stop health check interval
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        // Cleanup workspace
        try {
            await fs.rm(this.workDir, { recursive: true, force: true });
        } catch (error) {
            logger.warn(`Failed to cleanup workspace: ${error.message}`);
        }

        // Additional cleanup
        await this.performCustomCleanup();
    }

    async performCustomCleanup() {
        // Optional cleanup steps for specific strategies
    }

    async checkHealth() {
        try {
            const health = await this.performHealthCheck();
            
            // Update deployment health status
            await this.deployment.update({
                healthStatus: {
                    status: health.status,
                    lastCheck: new Date(),
                    details: health.details
                }
            });

            return health;
        } catch (error) {
            logger.error(`Health check failed: ${error.message}`);
            
            await this.deployment.update({
                healthStatus: {
                    status: 'unhealthy',
                    lastCheck: new Date(),
                    details: { error: error.message }
                }
            });

            return { status: 'unhealthy', details: { error: error.message } };
        }
    }

    async performHealthCheck() {
        throw new Error('performHealthCheck() must be implemented');
    }

    startHealthCheck(interval = 30000) {
        this.healthCheckInterval = setInterval(() => {
            this.checkHealth().catch(error => {
                logger.error(`Health check interval failed: ${error.message}`);
            });
        }, interval);
    }

    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
}

module.exports = DeploymentStrategy;
