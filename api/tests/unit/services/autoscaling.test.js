const { expect } = require('chai');
const sinon = require('sinon');
const autoScalingService = require('../../../src/services/autoscaling');
const deploymentService = require('../../../src/services/deployment');
const { AppError } = require('../../../src/middleware/errorHandler');

describe('AutoScalingService', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('validateRule', () => {
        it('should validate a correct scaling rule', () => {
            const rule = {
                metric: 'cpu',
                operator: '>',
                threshold: 80,
                action: 'scale_up',
                instances: {
                    min: 1,
                    max: 5
                }
            };

            expect(() => autoScalingService.validateRule(rule)).to.not.throw();
        });

        it('should throw error for invalid metric', () => {
            const rule = {
                metric: 'invalid',
                operator: '>',
                threshold: 80,
                action: 'scale_up',
                instances: { min: 1, max: 5 }
            };

            expect(() => autoScalingService.validateRule(rule))
                .to.throw(AppError)
                .with.property('message')
                .that.includes('Invalid metric');
        });

        it('should throw error for invalid operator', () => {
            const rule = {
                metric: 'cpu',
                operator: '!=',
                threshold: 80,
                action: 'scale_up',
                instances: { min: 1, max: 5 }
            };

            expect(() => autoScalingService.validateRule(rule))
                .to.throw(AppError)
                .with.property('message')
                .that.includes('Invalid operator');
        });

        it('should throw error for invalid threshold', () => {
            const rule = {
                metric: 'cpu',
                operator: '>',
                threshold: -1,
                action: 'scale_up',
                instances: { min: 1, max: 5 }
            };

            expect(() => autoScalingService.validateRule(rule))
                .to.throw(AppError)
                .with.property('message')
                .that.includes('Invalid threshold');
        });
    });

    describe('evaluateCondition', () => {
        it('should correctly evaluate greater than', () => {
            expect(autoScalingService.evaluateCondition(90, '>', 80)).to.be.true;
            expect(autoScalingService.evaluateCondition(70, '>', 80)).to.be.false;
        });

        it('should correctly evaluate less than', () => {
            expect(autoScalingService.evaluateCondition(70, '<', 80)).to.be.true;
            expect(autoScalingService.evaluateCondition(90, '<', 80)).to.be.false;
        });

        it('should correctly evaluate equals', () => {
            expect(autoScalingService.evaluateCondition(80, '==', 80)).to.be.true;
            expect(autoScalingService.evaluateCondition(70, '==', 80)).to.be.false;
        });
    });

    describe('calculateNewInstances', () => {
        it('should scale up within limits', () => {
            const rule = {
                action: 'scale_up',
                instances: { min: 1, max: 5 }
            };

            expect(autoScalingService.calculateNewInstances(3, rule)).to.equal(4);
            expect(autoScalingService.calculateNewInstances(5, rule)).to.equal(5);
        });

        it('should scale down within limits', () => {
            const rule = {
                action: 'scale_down',
                instances: { min: 1, max: 5 }
            };

            expect(autoScalingService.calculateNewInstances(3, rule)).to.equal(2);
            expect(autoScalingService.calculateNewInstances(1, rule)).to.equal(1);
        });
    });

    describe('collectProjectMetrics', () => {
        it('should collect and format metrics correctly', async () => {
            const mockDeployment = { id: 'test-deployment' };
            const mockHealth = {
                status: 'healthy',
                details: {
                    cpu: { usage: 50 },
                    memory: { usage: 1024, percentage: 60 }
                }
            };

            sandbox.stub(autoScalingService, 'getActiveDeployment').resolves(mockDeployment);
            sandbox.stub(deploymentService, 'checkHealth').resolves(mockHealth);

            const metrics = await autoScalingService.collectProjectMetrics('test-project');

            expect(metrics).to.have.property('cpu', 50);
            expect(metrics).to.have.property('memory', 1024);
            expect(metrics).to.have.property('memory_percent', 60);
            expect(metrics).to.have.property('system');
        });

        it('should throw error when deployment is not found', async () => {
            sandbox.stub(autoScalingService, 'getActiveDeployment').resolves(null);

            await expect(autoScalingService.collectProjectMetrics('test-project'))
                .to.be.rejectedWith('No active deployment found');
        });

        it('should throw error when deployment is unhealthy', async () => {
            const mockDeployment = { id: 'test-deployment' };
            const mockHealth = { status: 'unhealthy' };

            sandbox.stub(autoScalingService, 'getActiveDeployment').resolves(mockDeployment);
            sandbox.stub(deploymentService, 'checkHealth').resolves(mockHealth);

            await expect(autoScalingService.collectProjectMetrics('test-project'))
                .to.be.rejectedWith('Deployment is not healthy');
        });
    });
});
