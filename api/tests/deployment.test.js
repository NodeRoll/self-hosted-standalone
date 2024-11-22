const request = require('supertest');
const app = require('../src/app');
const { Project, Deployment } = require('../src/models');
const { createTestUser, createTestProject, cleanupDatabase } = require('./helpers');
const githubService = require('../src/services/github.service');
const agentService = require('../src/services/agent.service');

jest.mock('../src/services/github.service');
jest.mock('../src/services/agent.service');

describe('Deployment Controller', () => {
    let testUser;
    let testProject;
    let authToken;

    beforeEach(async () => {
        await cleanupDatabase();
        testUser = await createTestUser();
        authToken = testUser.generateToken();
        testProject = await createTestProject(testUser.id);
    });

    describe('POST /api/projects/:projectId/deployments', () => {
        it('should create a new deployment', async () => {
            const commitHash = '123abc';
            githubService.validateCommit.mockResolvedValueOnce(true);
            agentService.publishToAgent.mockResolvedValueOnce();

            const response = await request(app)
                .post(`/api/projects/${testProject.id}/deployments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ commitHash, branch: 'main' });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                project_id: testProject.id,
                commit_hash: commitHash,
                branch: 'main',
                status: 'pending',
                initiated_by: testUser.id
            });

            // Verify GitHub validation was called
            expect(githubService.validateCommit).toHaveBeenCalledWith(
                'testowner',
                'testrepo',
                commitHash
            );

            // Verify agent was notified
            expect(agentService.publishToAgent).toHaveBeenCalledWith(
                'deployment.create',
                expect.objectContaining({
                    projectId: testProject.id,
                    commitHash,
                    branch: 'main'
                })
            );
        });

        it('should fail with invalid commit hash', async () => {
            githubService.validateCommit.mockRejectedValueOnce(new Error('Invalid commit'));

            const response = await request(app)
                .post(`/api/projects/${testProject.id}/deployments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ commitHash: 'invalid', branch: 'main' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid commit');
        });
    });

    describe('GET /api/projects/:projectId/deployments', () => {
        it('should list deployments', async () => {
            // Create test deployments
            await Deployment.bulkCreate([
                {
                    project_id: testProject.id,
                    commit_hash: '123abc',
                    branch: 'main',
                    status: 'completed',
                    initiated_by: testUser.id
                },
                {
                    project_id: testProject.id,
                    commit_hash: '456def',
                    branch: 'main',
                    status: 'pending',
                    initiated_by: testUser.id
                }
            ]);

            const response = await request(app)
                .get(`/api/projects/${testProject.id}/deployments`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.deployments).toHaveLength(2);
            expect(response.body.total).toBe(2);
        });

        it('should filter deployments by status', async () => {
            // Create test deployments
            await Deployment.bulkCreate([
                {
                    project_id: testProject.id,
                    commit_hash: '123abc',
                    branch: 'main',
                    status: 'completed',
                    initiated_by: testUser.id
                },
                {
                    project_id: testProject.id,
                    commit_hash: '456def',
                    branch: 'main',
                    status: 'pending',
                    initiated_by: testUser.id
                }
            ]);

            const response = await request(app)
                .get(`/api/projects/${testProject.id}/deployments?status=completed`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.deployments).toHaveLength(1);
            expect(response.body.deployments[0].status).toBe('completed');
        });
    });

    describe('GET /api/projects/:projectId/deployments/:deploymentId', () => {
        it('should get deployment details', async () => {
            const deployment = await Deployment.create({
                project_id: testProject.id,
                commit_hash: '123abc',
                branch: 'main',
                status: 'completed',
                initiated_by: testUser.id
            });

            const response = await request(app)
                .get(`/api/projects/${testProject.id}/deployments/${deployment.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: deployment.id,
                project_id: testProject.id,
                commit_hash: '123abc',
                status: 'completed'
            });
        });

        it('should return 404 for non-existent deployment', async () => {
            const response = await request(app)
                .get(`/api/projects/${testProject.id}/deployments/999`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/projects/:projectId/deployments/:deploymentId/cancel', () => {
        it('should cancel a pending deployment', async () => {
            const deployment = await Deployment.create({
                project_id: testProject.id,
                commit_hash: '123abc',
                branch: 'main',
                status: 'pending',
                initiated_by: testUser.id
            });

            agentService.publishToAgent.mockResolvedValueOnce();

            const response = await request(app)
                .post(`/api/projects/${testProject.id}/deployments/${deployment.id}/cancel`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('cancelled');

            // Verify agent was notified
            expect(agentService.publishToAgent).toHaveBeenCalledWith(
                'deployment.cancel',
                expect.objectContaining({
                    deploymentId: deployment.id,
                    projectId: testProject.id
                })
            );
        });

        it('should not cancel a completed deployment', async () => {
            const deployment = await Deployment.create({
                project_id: testProject.id,
                commit_hash: '123abc',
                branch: 'main',
                status: 'completed',
                initiated_by: testUser.id
            });

            const response = await request(app)
                .post(`/api/projects/${testProject.id}/deployments/${deployment.id}/cancel`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/projects/:projectId/deployments/:deploymentId/rollback', () => {
        it('should create a rollback deployment', async () => {
            const deployment = await Deployment.create({
                project_id: testProject.id,
                commit_hash: '123abc',
                branch: 'main',
                status: 'completed',
                initiated_by: testUser.id
            });

            agentService.publishToAgent.mockResolvedValueOnce();

            const response = await request(app)
                .post(`/api/projects/${testProject.id}/deployments/${deployment.id}/rollback`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                project_id: testProject.id,
                commit_hash: '123abc',
                status: 'pending',
                rollback_from_id: deployment.id
            });

            // Verify agent was notified
            expect(agentService.publishToAgent).toHaveBeenCalledWith(
                'deployment.rollback',
                expect.objectContaining({
                    projectId: testProject.id,
                    fromDeploymentId: deployment.id
                })
            );
        });

        it('should not rollback from a pending deployment', async () => {
            const deployment = await Deployment.create({
                project_id: testProject.id,
                commit_hash: '123abc',
                branch: 'main',
                status: 'pending',
                initiated_by: testUser.id
            });

            const response = await request(app)
                .post(`/api/projects/${testProject.id}/deployments/${deployment.id}/rollback`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/deployments/:deploymentId/status', () => {
        it('should update deployment status', async () => {
            const deployment = await Deployment.create({
                project_id: testProject.id,
                commit_hash: '123abc',
                branch: 'main',
                status: 'pending',
                initiated_by: testUser.id
            });

            const response = await request(app)
                .post(`/api/deployments/${deployment.id}/status`)
                .send({
                    status: 'completed',
                    logs: 'Deployment successful'
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: deployment.id,
                status: 'completed',
                logs: 'Deployment successful'
            });
        });
    });
});
