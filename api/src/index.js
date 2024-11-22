require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const sequelize = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const setupWebSocket = require('./websocket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Setup WebSocket
const wss = setupWebSocket(server);

// Database connection and server start
async function startServer() {
    try {
        await sequelize.authenticate();
        logger.info('Connected to SQLite database');

        server.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info('WebSocket server is ready for connections');
        });
    } catch (error) {
        logger.error('Unable to start server:', error);
        process.exit(1);
    }
}

startServer();
