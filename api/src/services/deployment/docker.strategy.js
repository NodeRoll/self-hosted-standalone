const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const logger = require('../../utils/logger');
const configService = require('../config.service');
const DeploymentStrategy = require('./base.strategy');
const { AppError } = require('../../middleware/errorHandler');
const dockerode = require('dockerode');
const docker = new dockerode();

class DockerDeploymentStrategy extends DeploymentStrategy {
    constructor(deployment, project) {
        super();
        this.deployment = deployment;
        this.project = project;
        this.workDir = path.join(process.env.WORKSPACE_DIR || '/tmp/noderoll', project.id, deployment.id);
        this.containerName = `noderoll-${project.id}-${deployment.branch}`.toLowerCase();
        this.networkName = `noderoll-${project.id}-network`;
        this.volumeName = `noderoll-${project.id}-data`;
    }

    async validateRequiredFiles() {
        const dockerfilePath = path.join(this.workDir, 'Dockerfile');
        try {
            await fs.access(dockerfilePath);
        } catch {
            throw new Error('Dockerfile not found in repository');
        }

        // Validate Dockerfile content
        const dockerfileContent = await fs.readFile(dockerfilePath, 'utf8');
        if (!dockerfileContent.includes('EXPOSE')) {
            throw new Error('Dockerfile must expose at least one port');
        }
    }

    async validateConfig() {
        const config = this.deployment.config || {};
        
        // Validate environment variables
        if (config.env && typeof config.env !== 'object') {
            throw new Error('Environment configuration must be an object');
        }

        // Validate volume mounts
        if (config.volumes) {
            if (!Array.isArray(config.volumes)) {
                throw new Error('Volumes configuration must be an array');
            }
            for (const volume of config.volumes) {
                if (!volume.source || !volume.target) {
                    throw new Error('Each volume must have source and target paths');
                }
            }
        }
    }

    async deploy() {
        try {
            await this.validate();
            await this.setupNetwork();
            await this.setupVolumes();

            // Run pre-deploy hooks
            await configService.processHooks(this.deployment.config, 'preDeploy', this.workDir);

            // Build Docker image
            logger.info(`Building Docker image for ${this.project.name}`);
            await this.buildImage();

            // Stop and remove existing container if it exists
            await this.cleanup();

            // Create and start container
            const container = await this.createContainer();
            await container.start();

            // Wait for container to be healthy
            await this.waitForHealthy(container);

            // Run post-deploy hooks
            await configService.processHooks(this.deployment.config, 'postDeploy', this.workDir);

            // Start health checks
            this.startHealthCheck();

            return {
                containerId: container.id,
                networkName: this.networkName,
                volumeName: this.volumeName
            };
        } catch (error) {
            logger.error('Docker deployment failed:', error);
            await this.cleanup();
            throw new AppError(500, `Deployment failed: ${error.message}`);
        }
    }

    async buildImage() {
        const stream = await docker.buildImage({
            context: this.workDir,
            src: ['Dockerfile', '.']
        }, {
            t: this.containerName,
            buildargs: this.deployment.config.buildArgs || {}
        });

        return new Promise((resolve, reject) => {
            docker.modem.followProgress(stream, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
    }

    async createContainer() {
        const config = this.deployment.config || {};
        const resourceLimits = this.deployment.resourceLimits || {};

        return await docker.createContainer({
            Image: this.containerName,
            name: this.containerName,
            Hostname: this.containerName,
            NetworkingConfig: {
                EndpointsConfig: {
                    [this.networkName]: {}
                }
            },
            HostConfig: {
                RestartPolicy: {
                    Name: 'unless-stopped'
                },
                Memory: resourceLimits.memory,
                NanoCPUs: resourceLimits.cpus * 1e9,
                MemorySwap: resourceLimits.memory * 2,
                Binds: this.getVolumeMappings(),
                NetworkMode: this.networkName
            },
            Env: this.getEnvironmentVariables(),
            Labels: {
                'noderoll.project': this.project.id,
                'noderoll.deployment': this.deployment.id
            },
            HealthCheck: {
                Test: ["CMD", "curl", "-f", "http://localhost:${config.healthCheck?.port || 80}/health"],
                Interval: 30000000000, // 30s
                Timeout: 10000000000,  // 10s
                Retries: 3
            }
        });
    }

    async setupNetwork() {
        try {
            const networks = await docker.listNetworks({
                filters: { name: [this.networkName] }
            });

            if (networks.length === 0) {
                await docker.createNetwork({
                    Name: this.networkName,
                    Driver: 'bridge',
                    Labels: {
                        'noderoll.project': this.project.id
                    }
                });
                logger.info(`Created network: ${this.networkName}`);
            }
        } catch (error) {
            throw new Error(`Failed to setup network: ${error.message}`);
        }
    }

    async setupVolumes() {
        try {
            const volumes = await docker.listVolumes({
                filters: { name: [this.volumeName] }
            });

            if (!volumes.Volumes.some(v => v.Name === this.volumeName)) {
                await docker.createVolume({
                    Name: this.volumeName,
                    Labels: {
                        'noderoll.project': this.project.id
                    }
                });
                logger.info(`Created volume: ${this.volumeName}`);
            }
        } catch (error) {
            throw new Error(`Failed to setup volume: ${error.message}`);
        }
    }

    getVolumeMappings() {
        const config = this.deployment.config || {};
        const mappings = [`${this.volumeName}:/data`];

        if (config.volumes) {
            mappings.push(...config.volumes.map(v => `${v.source}:${v.target}`));
        }

        return mappings;
    }

    getEnvironmentVariables() {
        const config = this.deployment.config || {};
        const envVars = [];

        // Add default environment variables
        envVars.push(`NODE_ENV=${process.env.NODE_ENV || 'production'}`);
        
        // Add project environment variables
        if (this.project.envVars) {
            Object.entries(this.project.envVars).forEach(([key, value]) => {
                envVars.push(`${key}=${value}`);
            });
        }

        // Add deployment-specific environment variables
        if (config.env) {
            Object.entries(config.env).forEach(([key, value]) => {
                envVars.push(`${key}=${value}`);
            });
        }

        return envVars;
    }

    async performHealthCheck() {
        try {
            const container = docker.getContainer(this.containerName);
            const info = await container.inspect();

            if (!info.State.Running) {
                return {
                    status: 'unhealthy',
                    details: {
                        state: info.State,
                        exitCode: info.State.ExitCode
                    }
                };
            }

            // Get container stats
            const stats = await container.stats({ stream: false });
            
            return {
                status: info.State.Health?.Status || 'healthy',
                details: {
                    state: info.State,
                    stats: {
                        cpu: this.calculateCPUPercentage(stats),
                        memory: this.calculateMemoryUsage(stats),
                        network: this.getNetworkStats(stats)
                    }
                }
            };
        } catch (error) {
            throw new Error(`Health check failed: ${error.message}`);
        }
    }

    calculateCPUPercentage(stats) {
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const cpuCount = stats.cpu_stats.online_cpus;

        return (cpuDelta / systemDelta) * cpuCount * 100;
    }

    calculateMemoryUsage(stats) {
        return {
            usage: stats.memory_stats.usage,
            limit: stats.memory_stats.limit,
            percentage: (stats.memory_stats.usage / stats.memory_stats.limit) * 100
        };
    }

    getNetworkStats(stats) {
        const networks = stats.networks || {};
        return Object.entries(networks).map(([interface, stats]) => ({
            interface,
            rx_bytes: stats.rx_bytes,
            tx_bytes: stats.tx_bytes
        }));
    }

    async getLogs(options = {}) {
        try {
            const container = docker.getContainer(this.containerName);
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail: options.tail || 100,
                since: options.since || 0,
                timestamps: true
            });

            return logs.toString('utf8');
        } catch (error) {
            throw new Error(`Failed to get logs: ${error.message}`);
        }
    }

    async stop() {
        try {
            const container = docker.getContainer(this.containerName);
            await container.stop({ t: 10 });
            logger.info(`Stopped container: ${this.containerName}`);
        } catch (error) {
            if (error.statusCode !== 404) {
                throw new Error(`Failed to stop container: ${error.message}`);
            }
        }
    }

    async performCustomCleanup() {
        try {
            // Remove container
            const container = docker.getContainer(this.containerName);
            await container.remove({ force: true });
            logger.info(`Removed container: ${this.containerName}`);

            // Remove image
            const image = docker.getImage(this.containerName);
            await image.remove({ force: true });
            logger.info(`Removed image: ${this.containerName}`);

            // Cleanup network if no other containers are using it
            const network = docker.getNetwork(this.networkName);
            const networkInfo = await network.inspect();
            if (Object.keys(networkInfo.Containers).length === 0) {
                await network.remove();
                logger.info(`Removed network: ${this.networkName}`);
            }
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
        const strategy = new DockerDeploymentStrategy(rollbackDeployment, this.project);
        return await strategy.deploy();
    }

    async updateInstances(instances) {
        const serviceName = `noderoll-${this.project.id}`;
        
        try {
            const service = await this.docker.getService(serviceName);
            const serviceSpec = await service.inspect();
            
            // Update replica count
            serviceSpec.Spec.Mode.Replicated.Replicas = instances;
            
            // Update service with new configuration
            await service.update({
                ...serviceSpec.Spec,
                version: serviceSpec.Version.Index
            });
            
            logger.info(`Updated service ${serviceName} to ${instances} instances`);
            return true;
        } catch (error) {
            logger.error(`Failed to update service instances: ${error.message}`);
            throw new AppError(500, `Failed to update service instances: ${error.message}`);
        }
    }

    async getCurrentInstances() {
        const serviceName = `noderoll-${this.project.id}`;
        
        try {
            const service = await this.docker.getService(serviceName);
            const serviceSpec = await service.inspect();
            
            return serviceSpec.Spec.Mode.Replicated.Replicas;
        } catch (error) {
            logger.error(`Failed to get current instances: ${error.message}`);
            throw new AppError(500, `Failed to get current instances: ${error.message}`);
        }
    }
}

module.exports = DockerDeploymentStrategy;
