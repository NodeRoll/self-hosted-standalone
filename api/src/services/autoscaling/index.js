const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const deploymentService = require('../deployment');
const os = require('os');

class AutoScalingService {
    constructor() {
        this.rules = new Map();
        this.metrics = new Map();
        this.checkInterval = 30000; // 30 seconds
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startMetricsCollection();
        this.startScalingCheck();
    }

    async stop() {
        this.isRunning = false;
    }

    async addRule(projectId, rule) {
        this.validateRule(rule);
        this.rules.set(projectId, rule);
        logger.info(`Added scaling rule for project ${projectId}:`, rule);
    }

    async removeRule(projectId) {
        this.rules.delete(projectId);
        logger.info(`Removed scaling rule for project ${projectId}`);
    }

    validateRule(rule) {
        const validMetrics = ['cpu', 'memory', 'requests'];
        const validOperators = ['>', '<', '>=', '<=', '=='];

        if (!rule.metric || !validMetrics.includes(rule.metric)) {
            throw new AppError(400, `Invalid metric. Must be one of: ${validMetrics.join(', ')}`);
        }

        if (!rule.operator || !validOperators.includes(rule.operator)) {
            throw new AppError(400, `Invalid operator. Must be one of: ${validOperators.join(', ')}`);
        }

        if (typeof rule.threshold !== 'number' || rule.threshold < 0) {
            throw new AppError(400, 'Invalid threshold. Must be a positive number');
        }

        if (!rule.action || !['scale_up', 'scale_down'].includes(rule.action)) {
            throw new AppError(400, 'Invalid action. Must be either scale_up or scale_down');
        }

        if (typeof rule.instances !== 'object' || 
            typeof rule.instances.min !== 'number' || 
            typeof rule.instances.max !== 'number' || 
            rule.instances.min < 1 || 
            rule.instances.max < rule.instances.min) {
            throw new AppError(400, 'Invalid instances configuration');
        }

        return true;
    }

    async startMetricsCollection() {
        const collectMetrics = async () => {
            if (!this.isRunning) return;

            for (const [projectId] of this.rules) {
                try {
                    const metrics = await this.collectProjectMetrics(projectId);
                    this.metrics.set(projectId, {
                        timestamp: Date.now(),
                        ...metrics
                    });
                } catch (error) {
                    logger.error(`Failed to collect metrics for project ${projectId}:`, error);
                }
            }

            if (this.isRunning) {
                setTimeout(collectMetrics, this.checkInterval);
            }
        };

        collectMetrics();
    }

    async startScalingCheck() {
        const checkScaling = async () => {
            if (!this.isRunning) return;

            for (const [projectId, rule] of this.rules) {
                try {
                    await this.evaluateScalingRule(projectId, rule);
                } catch (error) {
                    logger.error(`Failed to evaluate scaling rule for project ${projectId}:`, error);
                }
            }

            if (this.isRunning) {
                setTimeout(checkScaling, this.checkInterval);
            }
        };

        checkScaling();
    }

    async collectProjectMetrics(projectId) {
        const deployment = await this.getActiveDeployment(projectId);
        if (!deployment) {
            throw new Error('No active deployment found');
        }

        const health = await deploymentService.checkHealth(deployment, { id: projectId });
        if (!health || health.status !== 'healthy') {
            throw new Error('Deployment is not healthy');
        }

        const metrics = health.details;
        const systemMetrics = await this.collectSystemMetrics();

        return {
            cpu: metrics.cpu.usage,
            memory: metrics.memory.usage,
            memory_percent: metrics.memory.percentage,
            system: systemMetrics
        };
    }

    async collectSystemMetrics() {
        return {
            total_memory: os.totalmem(),
            free_memory: os.freemem(),
            cpu_load: os.loadavg(),
            uptime: os.uptime()
        };
    }

    async evaluateScalingRule(projectId, rule) {
        const metrics = this.metrics.get(projectId);
        if (!metrics || Date.now() - metrics.timestamp > this.checkInterval * 2) {
            logger.warn(`No recent metrics available for project ${projectId}`);
            return;
        }

        const currentValue = this.getMetricValue(metrics, rule.metric);
        const shouldScale = this.evaluateCondition(currentValue, rule.operator, rule.threshold);

        if (shouldScale) {
            await this.executeScalingAction(projectId, rule);
        }
    }

    getMetricValue(metrics, metricName) {
        switch (metricName) {
            case 'cpu':
                return metrics.cpu;
            case 'memory':
                return metrics.memory_percent;
            default:
                throw new Error(`Unsupported metric: ${metricName}`);
        }
    }

    evaluateCondition(value, operator, threshold) {
        switch (operator) {
            case '>': return value > threshold;
            case '<': return value < threshold;
            case '>=': return value >= threshold;
            case '<=': return value <= threshold;
            case '==': return value === threshold;
            default: return false;
        }
    }

    async executeScalingAction(projectId, rule) {
        const deployment = await this.getActiveDeployment(projectId);
        if (!deployment) {
            throw new Error('No active deployment found');
        }

        const currentInstances = await this.getCurrentInstances(deployment);
        const newInstances = this.calculateNewInstances(currentInstances, rule);

        if (newInstances === currentInstances) {
            return;
        }

        await this.updateDeploymentInstances(deployment, newInstances);
        logger.info(`Scaled project ${projectId} from ${currentInstances} to ${newInstances} instances`);
    }

    async getCurrentInstances(deployment) {
        const health = await deploymentService.checkHealth(deployment);
        return health.details.instances || 1;
    }

    calculateNewInstances(current, rule) {
        const { min, max } = rule.instances;
        let newCount = current;

        if (rule.action === 'scale_up') {
            newCount = Math.min(max, current + 1);
        } else {
            newCount = Math.max(min, current - 1);
        }

        return newCount;
    }

    async updateDeploymentInstances(deployment, instances) {
        deployment.config = {
            ...deployment.config,
            process: {
                ...deployment.config.process,
                instances
            }
        };

        await deploymentService.deploy(deployment, { id: deployment.projectId });
    }

    async getActiveDeployment(projectId) {
        // Bu metod projenin aktif deployment'ını getirmeli
        // Gerçek implementasyon projenizin deployment yönetim sistemine bağlı olacak
        return null; // TODO: Implement this
    }
}

module.exports = new AutoScalingService();
