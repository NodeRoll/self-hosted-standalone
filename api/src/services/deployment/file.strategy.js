const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const logger = require('../../utils/logger');
const DeploymentStrategy = require('./base.strategy');
const { AppError } = require('../../middleware/errorHandler');
const pm2 = require('pm2');
const util = require('util');
const pm2Connect = util.promisify(pm2.connect.bind(pm2));
const pm2List = util.promisify(pm2.list.bind(pm2));
const pm2Start = util.promisify(pm2.start.bind(pm2));
const pm2Stop = util.promisify(pm2.stop.bind(pm2));
const pm2Delete = util.promisify(pm2.delete.bind(pm2));
const pm2Describe = util.promisify(pm2.describe.bind(pm2));

class FileDeploymentStrategy extends DeploymentStrategy {
    constructor(deployment, project) {
        super();
        this.deployment = deployment;
        this.project = project;
        this.workDir = path.join(process.env.WORKSPACE_DIR || '/tmp/noderoll', project.id, deployment.id);
        this.processName = `noderoll-${project.id}-${deployment.id}`;
        this.logDir = path.join(this.workDir, 'logs');
        this.configDir = path.join(this.workDir, '.noderoll');
    }

    async validateRequiredFiles() {
        // Check for package.json
        const packageJsonPath = path.join(this.workDir, 'package.json');
        try {
            await fs.access(packageJsonPath);
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            if (!packageJson.scripts || !packageJson.scripts.start) {
                throw new Error('package.json must contain a start script');
            }
        } catch (error) {
            throw new Error('Invalid package.json: ' + error.message);
        }

        // Ensure log directory exists
        await fs.mkdir(this.logDir, { recursive: true });
        await fs.mkdir(this.configDir, { recursive: true });
    }

    async validateConfig() {
        const config = this.deployment.config || {};
        
        // Validate process configuration
        if (config.process) {
            const { instances, maxMemory, script } = config.process;
            if (instances && (!Number.isInteger(instances) || instances < 1)) {
                throw new Error('Process instances must be a positive integer');
            }
            if (maxMemory && typeof maxMemory !== 'string') {
                throw new Error('Process maxMemory must be a string (e.g., "1G")');
            }
            if (script && typeof script !== 'string') {
                throw new Error('Process script must be a string');
            }
        }
    }

    async deploy() {
        try {
            await this.validate();

            // Install dependencies
            logger.info(`Installing dependencies for ${this.project.name}`);
            await execAsync('npm install --production', { cwd: this.workDir });

            // Create PM2 process configuration
            const processConfig = this.createProcessConfig();
            const configPath = path.join(this.configDir, 'process.json');
            await fs.writeFile(configPath, JSON.stringify(processConfig, null, 2));

            // Stop existing process if running
            await this.stop();

            // Connect to PM2
            await pm2Connect();

            // Start the application
            logger.info(`Starting application: ${this.project.name}`);
            await pm2Start(configPath);

            // Start health checks
            this.startHealthCheck();

            return {
                processName: this.processName,
                logDir: this.logDir,
                configPath
            };
        } catch (error) {
            logger.error('File-based deployment failed:', error);
            await this.cleanup();
            throw new AppError(500, `Deployment failed: ${error.message}`);
        } finally {
            pm2.disconnect();
        }
    }

    createProcessConfig() {
        const config = this.deployment.config || {};
        const processConfig = config.process || {};

        return {
            name: this.processName,
            script: processConfig.script || 'npm',
            args: processConfig.script ? [] : ['start'],
            cwd: this.workDir,
            instances: processConfig.instances || 1,
            exec_mode: processConfig.instances > 1 ? 'cluster' : 'fork',
            max_memory_restart: processConfig.maxMemory || '1G',
            autorestart: true,
            watch: false,
            env: this.getEnvironmentVariables(),
            merge_logs: true,
            error_file: path.join(this.logDir, 'error.log'),
            out_file: path.join(this.logDir, 'out.log'),
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            log_type: 'json',
            max_logs: '10',
            max_size: '10M'
        };
    }

    getEnvironmentVariables() {
        const env = {
            NODE_ENV: process.env.NODE_ENV || 'production',
            PORT: process.env.PORT || '3000'
        };

        // Add project environment variables
        if (this.project.envVars) {
            Object.assign(env, this.project.envVars);
        }

        // Add deployment-specific environment variables
        if (this.deployment.config && this.deployment.config.env) {
            Object.assign(env, this.deployment.config.env);
        }

        return env;
    }

    async performHealthCheck() {
        try {
            await pm2Connect();
            const processes = await pm2Describe(this.processName);
            
            if (!processes || processes.length === 0) {
                return {
                    status: 'unhealthy',
                    details: { error: 'Process not found' }
                };
            }

            const process = processes[0];
            const status = this.getProcessHealthStatus(process);
            const metrics = await this.collectProcessMetrics(process);

            return {
                status,
                details: {
                    ...metrics,
                    uptime: process.pm2_env.pm_uptime,
                    restarts: process.pm2_env.restart_time,
                    status: process.pm2_env.status
                }
            };
        } catch (error) {
            throw new Error(`Health check failed: ${error.message}`);
        } finally {
            pm2.disconnect();
        }
    }

    getProcessHealthStatus(process) {
        if (process.pm2_env.status !== 'online') {
            return 'unhealthy';
        }
        
        const metrics = process.monit;
        const config = this.deployment.config || {};
        const limits = config.process || {};

        if (limits.maxMemory && metrics.memory > this.parseMemoryLimit(limits.maxMemory)) {
            return 'unhealthy';
        }

        if (process.pm2_env.restart_time > (limits.maxRestarts || 10)) {
            return 'unhealthy';
        }

        return 'healthy';
    }

    async collectProcessMetrics(process) {
        const metrics = process.monit;
        return {
            memory: {
                usage: metrics.memory,
                percentage: (metrics.memory / os.totalmem()) * 100
            },
            cpu: {
                usage: metrics.cpu
            }
        };
    }

    parseMemoryLimit(limit) {
        const units = {
            'K': 1024,
            'M': 1024 * 1024,
            'G': 1024 * 1024 * 1024
        };
        const match = limit.match(/^(\d+)([KMG])$/);
        if (!match) return parseInt(limit);
        return parseInt(match[1]) * units[match[2]];
    }

    async getLogs(options = {}) {
        try {
            const logFile = options.error ? 
                path.join(this.logDir, 'error.log') : 
                path.join(this.logDir, 'out.log');

            const logs = await fs.readFile(logFile, 'utf8');
            const lines = logs.split('\n');

            if (options.tail) {
                return lines.slice(-options.tail).join('\n');
            }

            return logs;
        } catch (error) {
            throw new Error(`Failed to get logs: ${error.message}`);
        }
    }

    async stop() {
        try {
            await pm2Connect();
            await pm2Stop(this.processName);
            await pm2Delete(this.processName);
            logger.info(`Stopped process: ${this.processName}`);
        } catch (error) {
            if (!error.message.includes('process not found')) {
                throw new Error(`Failed to stop process: ${error.message}`);
            }
        } finally {
            pm2.disconnect();
        }
    }

    async performCustomCleanup() {
        try {
            // Stop and remove PM2 process
            await this.stop();

            // Clean up log files
            await fs.rm(this.logDir, { recursive: true, force: true });
            logger.info(`Removed log directory: ${this.logDir}`);

            // Clean up config directory
            await fs.rm(this.configDir, { recursive: true, force: true });
            logger.info(`Removed config directory: ${this.configDir}`);
        } catch (error) {
            logger.warn(`Cleanup error: ${error.message}`);
        }
    }

    async rollback() {
        // Get previous successful deployment
        const previousDeployment = await this.deployment.getPreviousSuccessful();
        if (!previousDeployment) {
            throw new Error('No previous successful deployment found for rollback');
        }

        // Stop current deployment
        await this.stop();

        // Create new deployment with previous configuration
        const rollbackDeployment = await this.deployment.createRollback(previousDeployment);

        // Deploy previous version
        const strategy = new FileDeploymentStrategy(rollbackDeployment, this.project);
        return await strategy.deploy();
    }
}

module.exports = FileDeploymentStrategy;
