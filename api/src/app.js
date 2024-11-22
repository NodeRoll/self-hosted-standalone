const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes');
const authRoutes = require('./routes/auth');
const deploymentRoutes = require('./routes/deployment');
const { authenticate } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/noderoll', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    logger.info('Connected to MongoDB');
}).catch((error) => {
    logger.error('MongoDB connection error:', error);
});

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api', authenticate, routes);
app.use('/api/deployments', deploymentRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
