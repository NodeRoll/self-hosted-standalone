const { expect } = require('chai');
const request = require('supertest');
const Docker = require('dockerode');
const path = require('path');
const fs = require('fs').promises;
const app = require('../../src/app');
const { generateToken } = require('../../src/utils/auth');
const { cleanup } = require('../utils/cleanup');

describe('Deployment E2E Tests', () => {
    let authToken;
    let docker;
    const testProject = {
        id: 'e2e-test-project',
        name: 'E2E Test Project'
    };
    const testAppDir = path.join(__dirname, '../fixtures/test-app');

    before(async () => {
        // Setup
        authToken = await generateToken({ id: 'test-user' });
        docker = new Docker();
        await cleanup(docker, testProject.id);
    });

    after(async () => {
        // Cleanup
        await cleanup(docker, testProject.id);
    });

    describe('Full Deployment Lifecycle', () => {
        let deploymentId;

        it('should deploy a test application', async () => {
            const deploymentConfig = {
                config: {
                    type: 'docker',
                    process: {
                        instances: 1,
                        maxMemory: '512M'
                    },
                    env: {
                        NODE_ENV: 'test'
                    }
                }
            };

            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/deploy`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(deploymentConfig)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('id');
            deploymentId = response.body.data.id;

            // Wait for deployment to be ready
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Verify container is running
            const containers = await docker.listContainers({
                filters: {
                    name: [`noderoll-${testProject.id}`]
                }
            });
            expect(containers).to.have.lengthOf(1);
        });

        it('should configure auto-scaling', async () => {
            const scalingRule = {
                metric: 'cpu',
                operator: '>',
                threshold: 80,
                action: 'scale_up',
                instances: {
                    min: 1,
                    max: 3
                }
            };

            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/scaling/${deploymentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(scalingRule)
                .expect(200);

            expect(response.body).to.have.property('success', true);
        });

        it('should monitor health and metrics', async () => {
            // Check health
            const healthResponse = await request(app)
                .get(`/api/deployments/${testProject.id}/health/${deploymentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(healthResponse.body.data).to.have.property('status', 'healthy');

            // Check metrics
            const metricsResponse = await request(app)
                .get(`/api/deployments/${testProject.id}/metrics/${deploymentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(metricsResponse.body.data).to.have.property('cpu');
            expect(metricsResponse.body.data).to.have.property('memory');
        });

        it('should perform rollback', async () => {
            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/rollback/${deploymentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('id');

            // Wait for rollback to complete
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Verify container is still running
            const containers = await docker.listContainers({
                filters: {
                    name: [`noderoll-${testProject.id}`]
                }
            });
            expect(containers).to.have.lengthOf(1);
        });

        it('should stop deployment', async () => {
            const response = await request(app)
                .post(`/api/deployments/${testProject.id}/stop/${deploymentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);

            // Wait for stop to complete
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify container is stopped
            const containers = await docker.listContainers({
                filters: {
                    name: [`noderoll-${testProject.id}`]
                }
            });
            expect(containers).to.have.lengthOf(0);
        });
    });
});
