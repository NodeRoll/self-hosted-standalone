const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { validateApiToken } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// API token validation
app.use(validateApiToken);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
