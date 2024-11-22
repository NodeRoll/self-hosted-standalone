const dockerService = require('./dockerService');
const logger = require('../utils/logger');
const { EventEmitter } = require('events');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

class MonitoringService extends EventEmitter {
    constructor() {
        super();
        this.monitors = new Map();
        this.metrics = new Map();
        this.POLLING_INTERVAL = 10000; // 10 seconds
    }

    async startMonitoring(deploymentId, containerId) {
        if (this.monitors.has(deploymentId)) {
            return;
        }

        logger.info(`Starting monitoring for deployment ${deploymentId}`);

        const monitor = {
            containerId,
            isRunning: true,
            lastCheck: Date.now(),
            metrics: {
                cpu: [],
                memory: [],
                network: [],
                disk: []
            }
        };

        this.monitors.set(deploymentId, monitor);
        this._pollMetrics(deploymentId).catch(error => {
            logger.error(`Error polling metrics for ${deploymentId}:`, error);
        });
    }

    async stopMonitoring(deploymentId) {
        const monitor = this.monitors.get(deploymentId);
        if (monitor) {
            monitor.isRunning = false;
            this.monitors.delete(deploymentId);
            logger.info(`Stopped monitoring for deployment ${deploymentId}`);
        }
    }

    async getMetrics(deploymentId) {
        const monitor = this.monitors.get(deploymentId);
        if (!monitor) {
            throw new Error(`No monitoring data found for deployment ${deploymentId}`);
        }

        return {
            cpu: this._calculateMetrics(monitor.metrics.cpu),
            memory: this._calculateMetrics(monitor.metrics.memory),
            network: this._calculateMetrics(monitor.metrics.network),
            disk: this._calculateMetrics(monitor.metrics.disk),
            lastCheck: monitor.lastCheck
        };
    }

    async getStatus(deploymentId) {
        const monitor = this.monitors.get(deploymentId);
        if (!monitor) {
            throw new Error(`No monitoring data found for deployment ${deploymentId}`);
        }

        try {
            const containerInfo = await dockerService.inspectContainer(monitor.containerId);
            const stats = await dockerService.getContainerStats(monitor.containerId);

            return {
                status: containerInfo.State.Status,
                health: containerInfo.State.Health?.Status || 'none',
                uptime: Date.now() - new Date(containerInfo.State.StartedAt).getTime(),
                restarts: containerInfo.RestartCount || 0,
                currentStats: {
                    cpu: stats.cpu_stats,
                    memory: stats.memory_stats,
                    network: stats.networks,
                    disk: stats.blkio_stats
                }
            };
        } catch (error) {
            logger.error(`Error getting status for ${deploymentId}:`, error);
            throw error;
        }
    }

    async _pollMetrics(deploymentId) {
        const monitor = this.monitors.get(deploymentId);
        
        while (monitor && monitor.isRunning) {
            try {
                const stats = await dockerService.getContainerStats(monitor.containerId);
                
                // Update metrics
                this._updateMetrics(monitor, stats);
                monitor.lastCheck = Date.now();

                // Emit metrics event
                this.emit('metrics', {
                    deploymentId,
                    metrics: await this.getMetrics(deploymentId)
                });

                // Check container health
                const status = await this.getStatus(deploymentId);
                if (status.health === 'unhealthy' || status.status !== 'running') {
                    this.emit('health_alert', {
                        deploymentId,
                        status,
                        timestamp: Date.now()
                    });
                }

                await sleep(this.POLLING_INTERVAL);
            } catch (error) {
                logger.error(`Error polling metrics for ${deploymentId}:`, error);
                await sleep(this.POLLING_INTERVAL);
            }
        }
    }

    _updateMetrics(monitor, stats) {
        // Keep last hour of metrics (360 data points with 10s interval)
        const MAX_METRICS = 360;

        // Update CPU metrics
        monitor.metrics.cpu.push({
            timestamp: Date.now(),
            usage: stats.cpu_stats.cpu_usage.total_usage,
            system_usage: stats.cpu_stats.system_cpu_usage
        });
        if (monitor.metrics.cpu.length > MAX_METRICS) {
            monitor.metrics.cpu.shift();
        }

        // Update Memory metrics
        monitor.metrics.memory.push({
            timestamp: Date.now(),
            usage: stats.memory_stats.usage,
            limit: stats.memory_stats.limit
        });
        if (monitor.metrics.memory.length > MAX_METRICS) {
            monitor.metrics.memory.shift();
        }

        // Update Network metrics
        const networkStats = Object.values(stats.networks || {}).reduce(
            (acc, net) => ({
                rx_bytes: (acc.rx_bytes || 0) + net.rx_bytes,
                tx_bytes: (acc.tx_bytes || 0) + net.tx_bytes
            }),
            {}
        );

        monitor.metrics.network.push({
            timestamp: Date.now(),
            ...networkStats
        });
        if (monitor.metrics.network.length > MAX_METRICS) {
            monitor.metrics.network.shift();
        }

        // Update Disk metrics
        const diskStats = {
            read_bytes: 0,
            write_bytes: 0
        };

        for (const stat of stats.blkio_stats.io_service_bytes_recursive || []) {
            if (stat.op === 'Read') diskStats.read_bytes += stat.value;
            if (stat.op === 'Write') diskStats.write_bytes += stat.value;
        }

        monitor.metrics.disk.push({
            timestamp: Date.now(),
            ...diskStats
        });
        if (monitor.metrics.disk.length > MAX_METRICS) {
            monitor.metrics.disk.shift();
        }
    }

    _calculateMetrics(metricArray) {
        if (!metricArray.length) {
            return null;
        }

        const current = metricArray[metricArray.length - 1];
        const timeRange = {
            start: metricArray[0].timestamp,
            end: current.timestamp
        };

        return {
            current,
            timeRange,
            history: metricArray
        };
    }
}

module.exports = new MonitoringService();
