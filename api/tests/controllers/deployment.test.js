const deploymentController = require('../../src/controllers/deployment.controller');
const { createTestUser, createTestProject } = require('../helpers');
const { Project, Deployment } = require('../../src/models');
const githubService = require('../../src/services/github.service');
const agentService = require('../../src/services/agent.service');

// Mock external services
jest.mock('../../src/services/github.service');
jest.mock('../../src/services/agent.service');

describe('Deployment Controller', () => {
    let user, project, req, res, next;

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        // Create test data
        user = await createTestUser();
        project = await createTestProject(user);

        // Setup request and response objects
        req = {
            user,
            params: { projectId: project.id },
            body: {
                commitHash: 'abc123',
                branch: 'main'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();

        // Mock GitHub service
        githubService.validateCommit.mockResolvedValue(true);

        // Mock agent service
        agentService.publishToAgent.mockResolvedValue(true);
    });

    describe('create', () => {
        it('should create a new deployment', async () => {
            await deploymentController.create(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalled();
            
            const deployment = res.json.mock.calls[0][0];
            expect(deployment.projectId).toBe(project.id);
            expect(deployment.commitHash).toBe('abc123');
            expect(deployment.status).toBe('pending');
            expect(deployment.initiatedBy).toBe(user.id);

            expect(githubService.validateCommit).toHaveBeenCalled();
            expect(agentService.publishToAgent).toHaveBeenCalled();
        });

        it('should handle invalid project ID', async () => {
            req.params.projectId = 'invalid-id';
            await deploymentController.create(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
        });

        it('should handle GitHub validation failure', async () => {
            githubService.validateCommit.mockRejectedValue(new Error('Invalid commit'));
            await deploymentController.create(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.message).toContain('Invalid commit');
        });
    });

    describe('list', () => {
        beforeEach(async () => {
            // Create test deployments
            await Deployment.bulkCreate([
                {
                    projectId: project.id,
                    commitHash: 'abc123',
                    branch: 'main',
                    status: 'completed',
                    initiatedBy: user.id
                },
                {
                    projectId: project.id,
                    commitHash: 'def456',
                    branch: 'main',
                    status: 'failed',
                    initiatedBy: user.id
                }
            ]);
        });

        it('should list deployments', async () => {
            req.query = { limit: 10, offset: 0 };
            await deploymentController.list(req, res, next);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.deployments).toHaveLength(2);
            expect(response.total).toBe(2);
        });

        it('should filter by status', async () => {
            req.query = { status: 'completed', limit: 10, offset: 0 };
            await deploymentController.list(req, res, next);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.deployments).toHaveLength(1);
            expect(response.deployments[0].status).toBe('completed');
        });
    });

    describe('get', () => {
        let deployment;

        beforeEach(async () => {
            deployment = await Deployment.create({
                projectId: project.id,
                commitHash: 'abc123',
                branch: 'main',
                status: 'completed',
                initiatedBy: user.id
            });
            req.params.deploymentId = deployment.id;
        });

        it('should get deployment details', async () => {
            await deploymentController.get(req, res, next);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.id).toBe(deployment.id);
            expect(response.commitHash).toBe('abc123');
        });

        it('should handle non-existent deployment', async () => {
            req.params.deploymentId = 'non-existent';
            await deploymentController.get(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
        });
    });

    describe('cancel', () => {
        let deployment;

        beforeEach(async () => {
            deployment = await Deployment.create({
                projectId: project.id,
                commitHash: 'abc123',
                branch: 'main',
                status: 'in_progress',
                initiatedBy: user.id
            });
            req.params.deploymentId = deployment.id;
        });

        it('should cancel an in-progress deployment', async () => {
            await deploymentController.cancel(req, res, next);

            expect(agentService.publishToAgent).toHaveBeenCalledWith(
                'deployment.cancel',
                expect.any(Object)
            );
            expect(res.json).toHaveBeenCalled();
            
            const response = res.json.mock.calls[0][0];
            expect(response.status).toBe('cancelled');
        });

        it('should not cancel a completed deployment', async () => {
            await deployment.update({ status: 'completed' });
            await deploymentController.cancel(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(400);
        });
    });
});
