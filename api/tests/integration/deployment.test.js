const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const deploymentService = require('../../src/services/deployment');
const autoScalingService = require('../../src/services/autoscaling');
const { generateToken } = require('../../src/utils/auth');

describe('Deployment API Integration Tests', () => {
    let authToken;
    const testProject = {
        id: 'test-project',
        name: 'Test Project'
    };

    before(async () => {
        // Generate auth token for tests
        authToken = await generateToken({ id: 'test-user' });
    });

    describe('POST /api/deployments/:projectId/deploy', () => {
        it('should create a new deployment', async () => {
            const deploymentConfig = {
                config: {
                    type: 'docker',
                    process: {
                        instances: 2,
                        maxMemory: '1G'
                    }
                }
            };

            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/deploy`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(deploymentConfig)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data');
        });

        it('should validate deployment configuration', async () => {
            const invalidConfig = {
                config: {
                    type: 'invalid'
                }
            };

            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/deploy`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidConfig)
                .expect(400);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('error');
        });
    });

    describe('POST /api/deployments/:projectId/scaling/:deploymentId', () => {
        const testDeployment = {
            id: 'test-deployment'
        };

        it('should add scaling rule', async () => {
            const scalingRule = {
                metric: 'cpu',
                operator: '>',
                threshold: 80,
                action: 'scale_up',
                instances: {
                    min: 1,
                    max: 5
                }
            };

            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/scaling/${testDeployment.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(scalingRule)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message');
        });

        it('should validate scaling rule', async () => {
            const invalidRule = {
                metric: 'invalid',
                operator: '>',
                threshold: -1
            };

            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/scaling/${testDeployment.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidRule)
                .expect(400);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('error');
        });
    });

    describe('GET /api/deployments/:projectId/health/:deploymentId', () => {
        const testDeployment = {
            id: 'test-deployment'
        };

        it('should get deployment health status', async () => {
            const response = await request(app)
                .get(`/api/deployments/${testProject.id}/health/${testDeployment.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data');
            expect(response.body.data).to.have.property('status');
        });
    });

    describe('GET /api/deployments/:projectId/logs/:deploymentId', () => {
        const testDeployment = {
            id: 'test-deployment'
        };

        it('should get deployment logs', async () => {
            const response = await request(app)
                .get(`/api/deployments/${testProject.id}/logs/${testDeployment.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .query({ tail: 100 })
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data');
        });
    });

    describe('POST /api/deployments/:projectId/rollback/:deploymentId', () => {
        const testDeployment = {
            id: 'test-deployment'
        };

        it('should rollback deployment', async () => {
            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/rollback/${testDeployment.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data');
        });
    });

    describe('GET /api/deployments/:projectId/metrics/:deploymentId', () => {
        const testDeployment = {
            id: 'test-deployment'
        };

        it('should get deployment metrics', async () => {
            const response = await request(app)
                .get(`/api/deployments/${testProject.id}/metrics/${testDeployment.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data');
            expect(response.body.data).to.have.property('cpu');
            expect(response.body.data).to.have.property('memory');
        });
    });
});
