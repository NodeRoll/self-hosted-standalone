const WebSocket = require('ws');
const url = require('url');
const logger = require('../utils/logger');
const logService = require('../services/logService');

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const { query } = url.parse(req.url, true);
        const deploymentId = query.deploymentId;

        if (!deploymentId) {
            logger.error('WebSocket connection attempt without deploymentId');
            ws.close(1008, 'deploymentId is required');
            return;
        }

        logger.info(`New WebSocket connection for deployment: ${deploymentId}`);

        // Add this connection to log service
        logService.addConnection(deploymentId, ws);

        // Handle incoming messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                
                switch (data.type) {
                    case 'getHistory':
                        handleHistoryRequest(ws, deploymentId, data);
                        break;
                    default:
                        logger.warn(`Unknown message type: ${data.type}`);
                }
            } catch (error) {
                logger.error('Error handling WebSocket message:', error);
            }
        });

        // Send initial connection success message
        ws.send(JSON.stringify({
            type: 'connection',
            data: {
                status: 'connected',
                deploymentId
            }
        }));
    });

    // Handle server errors
    wss.on('error', (error) => {
        logger.error('WebSocket server error:', error);
    });

    return wss;
}

async function handleHistoryRequest(ws, deploymentId, data) {
    try {
        const lines = data.lines || 100;
        const logs = await logService.getHistoricalLogs(deploymentId, lines);
        
        ws.send(JSON.stringify({
            type: 'history',
            data: {
                logs,
                deploymentId
            }
        }));
    } catch (error) {
        logger.error(`Error getting historical logs for deployment ${deploymentId}:`, error);
        ws.send(JSON.stringify({
            type: 'error',
            data: {
                message: 'Failed to get historical logs',
                error: error.message
            }
        }));
    }
}

module.exports = setupWebSocket;
