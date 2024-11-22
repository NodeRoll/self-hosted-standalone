const { expect } = require('chai');
const sinon = require('sinon');
const deploymentService = require('../../../src/services/deployment');
const FileDeploymentStrategy = require('../../../src/services/deployment/file.strategy');
const DockerDeploymentStrategy = require('../../../src/services/deployment/docker.strategy');
const { AppError } = require('../../../src/middleware/errorHandler');

describe('DeploymentService', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('deploy', () => {
        it('should deploy with docker strategy by default', async () => {
            const deployment = {
                config: {}
            };
            const project = { id: 'test-project' };

            const dockerDeployStub = sandbox.stub(DockerDeploymentStrategy.prototype, 'deploy').resolves();
            
            await deploymentService.deploy(deployment, project);
            
            expect(dockerDeployStub.calledOnce).to.be.true;
        });

        it('should deploy with file strategy when specified', async () => {
            const deployment = {
                config: { type: 'file' }
            };
            const project = { id: 'test-project' };

            const fileDeployStub = sandbox.stub(FileDeploymentStrategy.prototype, 'deploy').resolves();
            
            await deploymentService.deploy(deployment, project);
            
            expect(fileDeployStub.calledOnce).to.be.true;
        });

        it('should throw error for unsupported strategy', async () => {
            const deployment = {
                config: { type: 'unsupported' }
            };
            const project = { id: 'test-project' };

            await expect(deploymentService.deploy(deployment, project))
                .to.be.rejectedWith(AppError)
                .with.property('message')
                .that.includes('Unsupported deployment type');
        });
    });

    describe('stop', () => {
        it('should stop deployment with correct strategy', async () => {
            const deployment = {
                config: { type: 'docker' }
            };
            const project = { id: 'test-project' };

            const stopStub = sandbox.stub(DockerDeploymentStrategy.prototype, 'stop').resolves();
            
            await deploymentService.stop(deployment, project);
            
            expect(stopStub.calledOnce).to.be.true;
        });
    });

    describe('rollback', () => {
        it('should rollback deployment with correct strategy', async () => {
            const deployment = {
                config: { type: 'docker' }
            };
            const project = { id: 'test-project' };

            const rollbackStub = sandbox.stub(DockerDeploymentStrategy.prototype, 'rollback').resolves();
            
            await deploymentService.rollback(deployment, project);
            
            expect(rollbackStub.calledOnce).to.be.true;
        });
    });

    describe('getLogs', () => {
        it('should get logs with correct strategy', async () => {
            const deployment = {
                config: { type: 'docker' }
            };
            const project = { id: 'test-project' };
            const options = { tail: 100 };

            const getLogsStub = sandbox.stub(DockerDeploymentStrategy.prototype, 'getLogs').resolves('test logs');
            
            const logs = await deploymentService.getLogs(deployment, project, options);
            
            expect(getLogsStub.calledOnce).to.be.true;
            expect(logs).to.equal('test logs');
        });
    });

    describe('checkHealth', () => {
        it('should check health with correct strategy', async () => {
            const deployment = {
                config: { type: 'docker' }
            };
            const project = { id: 'test-project' };

            const healthCheckStub = sandbox.stub(DockerDeploymentStrategy.prototype, 'performHealthCheck').resolves({
                status: 'healthy',
                details: {}
            });
            
            const health = await deploymentService.checkHealth(deployment, project);
            
            expect(healthCheckStub.calledOnce).to.be.true;
            expect(health).to.have.property('status', 'healthy');
        });
    });

    describe('validateDeploymentConfig', () => {
        it('should validate config with correct strategy', async () => {
            const config = {
                type: 'docker',
                process: {
                    instances: 2,
                    maxMemory: '1G'
                }
            };

            const validateStub = sandbox.stub(DockerDeploymentStrategy.prototype, 'validateConfig').resolves(true);
            
            const result = await deploymentService.validateDeploymentConfig(config);
            
            expect(validateStub.calledOnce).to.be.true;
            expect(result).to.be.true;
        });

        it('should throw error for invalid config', async () => {
            const config = {
                type: 'docker',
                process: {
                    instances: -1
                }
            };

            sandbox.stub(DockerDeploymentStrategy.prototype, 'validateConfig')
                .rejects(new AppError(400, 'Invalid config'));

            await expect(deploymentService.validateDeploymentConfig(config))
                .to.be.rejectedWith(AppError)
                .with.property('message')
                .that.includes('Invalid config');
        });
    });
});
