const jwt = require('jsonwebtoken');
const { User, Project, Deployment, ProjectCollaborator } = require('../src/models');

// Create test user
const createTestUser = async (overrides = {}) => {
    const defaultUser = {
        name: 'Test User',
        email: 'test@example.com',
        github_id: '12345',
        role: 'user',
        avatar_url: 'https://github.com/test.png',
        github_token: 'test_github_token'
    };

    return await User.create({ ...defaultUser, ...overrides });
};

// Create test admin
const createTestAdmin = async (overrides = {}) => {
    return await createTestUser({ ...overrides, role: 'admin' });
};

// Create test project
const createTestProject = async (userId, overrides = {}) => {
    const defaultProject = {
        name: 'Test Project',
        description: 'A test project',
        github_repo: 'testowner/testrepo',
        branch: 'main',
        domain: `test-${Date.now()}.example.com`,
        env_vars: { NODE_ENV: 'test' },
        status: 'inactive',
        owner_id: userId
    };

    const project = await Project.create({ ...defaultProject, ...overrides });
    await ProjectCollaborator.create({
        project_id: project.id,
        user_id: userId,
        role: 'owner'
    });
    return project;
};

// Generate test JWT token
const generateTestToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
    );
};

// Clean up database
const cleanupDatabase = async () => {
    await Deployment.destroy({ where: {} });
    await ProjectCollaborator.destroy({ where: {} });
    await Project.destroy({ where: {} });
    await User.destroy({ where: {} });
};

// Test request headers
const getAuthHeader = (token) => ({
    Authorization: `Bearer ${token}`
});

module.exports = {
    createTestUser,
    createTestAdmin,
    createTestProject,
    generateTestToken,
    getAuthHeader,
    cleanupDatabase
};
