const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

// Disable logging during tests
logger.transports.forEach((t) => (t.silent = true));

// Mock external services
jest.mock('../src/services/github.service');
jest.mock('../src/services/agent.service');

// Setup test database
beforeAll(async () => {
    // Force sync all models in the correct order
    await sequelize.sync({ force: true });
});

// Cleanup after tests
afterAll(async () => {
    await sequelize.close();
});
