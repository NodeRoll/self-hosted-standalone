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

            try {
                // Validate commit hash with GitHub
                const [owner, repo] = project.githubRepo.split('/');
                await githubService.validateCommit(owner, repo, commitHash);
            } catch (error) {
                throw new AppError(400, `Invalid commit: ${error.message}`);
            }

            // Create deployment record
            const deployment = await Deployment.create({
                project_id: projectId,
                commit_hash: commitHash,
                branch: branch || project.branch,
                status: 'pending',
                initiated_by: req.user.id
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

            const where = { project_id: projectId };
            if (status) {
                where.status = status;
            }

            const deployments = await Deployment.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['created_at', 'DESC']],
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
                where: { id: deploymentId, project_id: projectId },
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
                where: { id: deploymentId, project_id: projectId }
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
                where: { id: deploymentId, project_id: projectId },
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
                project_id: projectId,
                commit_hash: deployment.commit_hash,
                branch: deployment.branch,
                status: 'pending',
                initiated_by: req.user.id,
                rollback_from_id: deployment.id
            });

            // Send rollback request to agent
            await publishToAgent('deployment.rollback', {
                deploymentId: rollbackDeployment.id,
                projectId,
                fromDeploymentId: deployment.id
            });

            logger.info(`Rollback initiated for project ${deployment.Project.name} to deployment ${deployment.id}`);

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
