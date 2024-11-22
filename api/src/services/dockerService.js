const Docker = require('dockerode');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');

class DockerService {
    constructor() {
        this.docker = new Docker();
        this.pipeline = promisify(stream.pipeline);
    }

    async createContainer(deployment) {
        try {
            const containerConfig = this._buildContainerConfig(deployment);
            const container = await this.docker.createContainer(containerConfig);
            return container;
        } catch (error) {
            logger.error('Error creating container:', error);
            throw error;
        }
    }

    async startContainer(containerId) {
        try {
            const container = this.docker.getContainer(containerId);
            await container.start();
            return await this.getContainerStats(containerId);
        } catch (error) {
            logger.error('Error starting container:', error);
            throw error;
        }
    }

    async stopContainer(containerId) {
        try {
            const container = this.docker.getContainer(containerId);
            await container.stop();
        } catch (error) {
            logger.error('Error stopping container:', error);
            throw error;
        }
    }

    async removeContainer(containerId) {
        try {
            const container = this.docker.getContainer(containerId);
            await container.remove({ force: true });
        } catch (error) {
            logger.error('Error removing container:', error);
            throw error;
        }
    }

    async buildImage(projectPath, tag) {
        try {
            const tarStream = await this._createTarStream(projectPath);
            const buildStream = await this.docker.buildImage(tarStream, { t: tag });
            
            return new Promise((resolve, reject) => {
                this.docker.modem.followProgress(buildStream, 
                    (err, output) => err ? reject(err) : resolve(output),
                    progress => logger.debug('Build progress:', progress)
                );
            });
        } catch (error) {
            logger.error('Error building image:', error);
            throw error;
        }
    }

    async getContainerStats(containerId) {
        try {
            const container = this.docker.getContainer(containerId);
            const stats = await container.stats({ stream: false });
            return this._parseContainerStats(stats);
        } catch (error) {
            logger.error('Error getting container stats:', error);
            throw error;
        }
    }

    async getContainerLogs(containerId, options = {}) {
        try {
            const container = this.docker.getContainer(containerId);
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail: options.tail || 100,
                follow: options.follow || false,
                timestamps: true
            });
            return logs;
        } catch (error) {
            logger.error('Error getting container logs:', error);
            throw error;
        }
    }

    _buildContainerConfig(deployment) {
        const { config, environment, resources } = deployment;
        
        return {
            Image: `${deployment.projectName}:${deployment.version}`,
            Env: Object.entries(environment).map(([key, value]) => `${key}=${value}`),
            ExposedPorts: {
                [`${config.port}/tcp`]: {}
            },
            HostConfig: {
                PortBindings: {
                    [`${config.port}/tcp`]: [{ HostPort: config.port.toString() }]
                },
                Memory: this._parseMemoryLimit(resources.memory),
                NanoCPUs: this._parseCPULimit(resources.cpu)
            },
            Labels: {
                'com.noderoll.project': deployment.projectName,
                'com.noderoll.version': deployment.version
            }
        };
    }

    _parseMemoryLimit(memoryString) {
        const units = {
            'K': 1024,
            'M': 1024 * 1024,
            'G': 1024 * 1024 * 1024
        };
        
        const match = memoryString.match(/^(\d+)([KMG])?$/);
        if (!match) throw new Error('Invalid memory format');
        
        const value = parseInt(match[1]);
        const unit = match[2] || 'M';
        
        return value * (units[unit] || units['M']);
    }

    _parseCPULimit(cpuString) {
        const cpu = parseFloat(cpuString);
        return Math.floor(cpu * 1e9); // Convert to nanoCPUs
    }

    async _createTarStream(projectPath) {
        // Implementation of tar stream creation
        // This is a placeholder - actual implementation needed
        throw new Error('Not implemented');
    }

    _parseContainerStats(stats) {
        return {
            cpu: {
                usage: stats.cpu_stats.cpu_usage.total_usage,
                system: stats.cpu_stats.system_cpu_usage
            },
            memory: {
                usage: stats.memory_stats.usage,
                limit: stats.memory_stats.limit
            },
            network: stats.networks
        };
    }
}

module.exports = new DockerService();
