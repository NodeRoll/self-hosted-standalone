const { Project, Deployment } = require('../models');
const githubService = require('../services/github.service');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { publishToAgent } = require('../services/agent.service');

class DeploymentController {
    async create(req, res, next) {
        try {
            const { projectId } = req.params;
            const { commitHash, branch } = req.body;

            const project = await Project.findByPk(projectId);
            if (!project) {
                throw new AppError(404, 'Project not found');
            }

            // Validate commit hash with GitHub
            const [owner, repo] = project.githubRepo.split('/');
            await githubService.validateCommit(req.user.githubToken, owner, repo, commitHash);

            // Create deployment record
            const deployment = await Deployment.create({
                projectId,
                commitHash,
                branch: branch || project.branch,
                status: 'pending',
                initiatedBy: req.user.id
            });

            // Send deployment request to agent
            await publishToAgent('deployment.create', {
                deploymentId: deployment.id,
                projectId: project.id,
                githubRepo: project.githubRepo,
                commitHash,
                branch: deployment.branch,
                envVars: project.envVars
            });

            logger.info(`Deployment initiated for project ${project.name} at commit ${commitHash}`);

            res.status(201).json(deployment);
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const { projectId } = req.params;
            const { status, limit = 10, offset = 0 } = req.query;

            const where = { projectId };
            if (status) {
                where.status = status;
            }

            const deployments = await Deployment.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
                include: [{
                    model: Project,
                    attributes: ['name', 'githubRepo']
                }]
            });

            res.json({
                deployments: deployments.rows,
                total: deployments.count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        } catch (error) {
            next(error);
        }
    }

    async get(req, res, next) {
        try {
            const { projectId, deploymentId } = req.params;

            const deployment = await Deployment.findOne({
                where: { id: deploymentId, projectId },
                include: [{
                    model: Project,
                    attributes: ['name', 'githubRepo', 'domain']
                }]
            });

            if (!deployment) {
                throw new AppError(404, 'Deployment not found');
            }

            res.json(deployment);
        } catch (error) {
            next(error);
        }
    }

    async cancel(req, res, next) {
        try {
            const { projectId, deploymentId } = req.params;

            const deployment = await Deployment.findOne({
                where: { id: deploymentId, projectId }
            });

            if (!deployment) {
                throw new AppError(404, 'Deployment not found');
            }

            if (!['pending', 'in_progress'].includes(deployment.status)) {
                throw new AppError(400, 'Cannot cancel deployment in current status');
            }

            // Send cancellation request to agent
            await publishToAgent('deployment.cancel', {
                deploymentId: deployment.id,
                projectId
            });

            await deployment.update({ status: 'cancelled' });
            logger.info(`Deployment ${deploymentId} cancelled`);

            res.json(deployment);
        } catch (error) {
            next(error);
        }
    }

    async rollback(req, res, next) {
        try {
            const { projectId, deploymentId } = req.params;

            const deployment = await Deployment.findOne({
                where: { id: deploymentId, projectId },
                include: [{ model: Project }]
            });

            if (!deployment) {
                throw new AppError(404, 'Deployment not found');
            }

            if (deployment.status !== 'completed') {
                throw new AppError(400, 'Can only rollback from completed deployments');
            }

            // Create new deployment for rollback
            const rollbackDeployment = await Deployment.create({
                projectId,
                commitHash: deployment.commitHash,
                branch: deployment.branch,
                status: 'pending',
                initiatedBy: req.user.id,
                rollbackFromId: deploymentId
            });

            // Send rollback request to agent
            await publishToAgent('deployment.create', {
                deploymentId: rollbackDeployment.id,
                projectId,
                githubRepo: deployment.Project.githubRepo,
                commitHash: deployment.commitHash,
                branch: deployment.branch,
                envVars: deployment.Project.envVars,
                isRollback: true
            });

            logger.info(`Rollback initiated for project ${deployment.Project.name} to commit ${deployment.commitHash}`);

            res.status(201).json(rollbackDeployment);
        } catch (error) {
            next(error);
        }
    }

    // Webhook endpoint for agent to update deployment status
    async updateStatus(req, res, next) {
        try {
            const { deploymentId } = req.params;
            const { status, logs, error } = req.body;

            const deployment = await Deployment.findByPk(deploymentId);
            if (!deployment) {
                throw new AppError(404, 'Deployment not found');
            }

            await deployment.update({
                status,
                logs: logs || deployment.logs,
                error: error || deployment.error
            });

            logger.info(`Deployment ${deploymentId} status updated to ${status}`);

            res.json(deployment);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DeploymentController();
