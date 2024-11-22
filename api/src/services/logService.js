const { spawn } = require('child_process');
const logger = require('../utils/logger');

class LogService {
    constructor() {
        // Store active log streams for each deployment
        this.activeStreams = new Map();
        // Store WebSocket connections for each deployment
        this.connections = new Map();
    }

    // Add a new WebSocket connection for a deployment
    addConnection(deploymentId, ws) {
        if (!this.connections.has(deploymentId)) {
            this.connections.set(deploymentId, new Set());
        }
        this.connections.get(deploymentId).add(ws);

        // Set up disconnect handler
        ws.on('close', () => {
            this.removeConnection(deploymentId, ws);
        });

        // Start streaming if not already started
        this.startStreaming(deploymentId);
    }

    // Remove a WebSocket connection
    removeConnection(deploymentId, ws) {
        const connections = this.connections.get(deploymentId);
        if (connections) {
            connections.delete(ws);
            if (connections.size === 0) {
                this.connections.delete(deploymentId);
                this.stopStreaming(deploymentId);
            }
        }
    }

    // Start streaming logs for a deployment
    startStreaming(deploymentId) {
        if (this.activeStreams.has(deploymentId)) {
            return; // Stream already active
        }

        try {
            // Using docker logs with follow option
            const stream = spawn('docker', ['logs', '--follow', '--tail', '100', deploymentId]);
            this.activeStreams.set(deploymentId, stream);

            stream.stdout.on('data', (data) => {
                this.broadcastLog(deploymentId, data.toString(), 'stdout');
            });

            stream.stderr.on('data', (data) => {
                this.broadcastLog(deploymentId, data.toString(), 'stderr');
            });

            stream.on('error', (error) => {
                logger.error(`Error streaming logs for deployment ${deploymentId}:`, error);
                this.broadcastLog(deploymentId, `Error streaming logs: ${error.message}`, 'error');
            });

            stream.on('close', () => {
                this.activeStreams.delete(deploymentId);
            });
        } catch (error) {
            logger.error(`Failed to start log streaming for deployment ${deploymentId}:`, error);
        }
    }

    // Stop streaming logs for a deployment
    stopStreaming(deploymentId) {
        const stream = this.activeStreams.get(deploymentId);
        if (stream) {
            stream.kill();
            this.activeStreams.delete(deploymentId);
        }
    }

    // Broadcast log message to all connected clients for a deployment
    broadcastLog(deploymentId, message, type) {
        const connections = this.connections.get(deploymentId);
        if (connections) {
            const logMessage = JSON.stringify({
                type: 'log',
                data: {
                    timestamp: new Date().toISOString(),
                    message,
                    type
                }
            });

            connections.forEach(ws => {
                if (ws.readyState === 1) { // WebSocket.OPEN
                    ws.send(logMessage);
                }
            });
        }
    }

    // Get historical logs for a deployment
    async getHistoricalLogs(deploymentId, lines = 100) {
        return new Promise((resolve, reject) => {
            const logs = spawn('docker', ['logs', '--tail', lines.toString(), deploymentId]);
            let output = '';

            logs.stdout.on('data', (data) => {
                output += data.toString();
            });

            logs.stderr.on('data', (data) => {
                output += data.toString();
            });

            logs.on('error', (error) => {
                reject(error);
            });

            logs.on('close', () => {
                resolve(output);
            });
        });
    }
}

module.exports = new LogService();
