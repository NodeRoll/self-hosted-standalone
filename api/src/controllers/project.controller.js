const { Project, User, ProjectCollaborator } = require('../models');
const githubService = require('../services/github.service');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ProjectController {
    async create(req, res, next) {
        try {
            const { name, description, github_repo, branch = 'main', domain } = req.body;

            // Validate GitHub repository
            const [owner, repo] = github_repo.split('/');
            if (!owner || !repo) {
                throw new AppError(400, 'Invalid GitHub repository format. Use owner/repo');
            }

            // Check if repository exists and user has access
            await githubService.getRepository(req.user.github_token, owner, repo);

            // Create project
            const project = await Project.create({
                name,
                description,
                github_repo,
                branch,
                domain,
                owner_id: req.user.id
            });

            // Add owner as collaborator
            await ProjectCollaborator.create({
                project_id: project.id,
                user_id: req.user.id,
                role: 'owner'
            });

            logger.info(`Project created: ${project.name} by ${req.user.email}`);

            res.status(201).json(project);
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const { role } = req.user;
            let projects;

            if (role === 'admin') {
                // Admins can see all projects
                projects = await Project.findAll({
                    include: [
                        { model: User, as: 'owner' },
                        { model: User, as: 'collaborators' }
                    ]
                });
            } else {
                // Users can see their projects and collaborations
                projects = await req.user.getProjects({
                    include: [
                        { model: User, as: 'owner' },
                        { model: User, as: 'collaborators' }
                    ]
                });
            }

            res.json(projects);
        } catch (error) {
            next(error);
        }
    }

    async get(req, res, next) {
        try {
            const { project_id } = req.params;
            const project = await Project.findByPk(project_id, {
                include: [
                    { model: User, as: 'owner' },
                    { model: User, as: 'collaborators' }
                ]
            });

            if (!project) {
                throw new AppError(404, 'Project not found');
            }

            res.json(project);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { project_id } = req.params;
            const { name, description, branch, domain } = req.body;

            const project = await Project.findByPk(project_id);
            if (!project) {
                throw new AppError(404, 'Project not found');
            }

            // Update project
            await project.update({
                name,
                description,
                branch,
                domain
            });

            logger.info(`Project updated: ${project.name}`);

            res.json(project);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { project_id } = req.params;

            const project = await Project.findByPk(project_id);
            if (!project) {
                throw new AppError(404, 'Project not found');
            }

            await project.destroy();
            logger.info(`Project deleted: ${project.name}`);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async addCollaborator(req, res, next) {
        try {
            const { project_id } = req.params;
            const { user_id, role = 'collaborator' } = req.body;

            const project = await Project.findByPk(project_id);
            if (!project) {
                throw new AppError(404, 'Project not found');
            }

            const user = await User.findByPk(user_id);
            if (!user) {
                throw new AppError(404, 'User not found');
            }

            await ProjectCollaborator.create({
                project_id,
                user_id,
                role
            });

            logger.info(`Collaborator added to ${project.name}: ${user.email}`);

            res.status(201).json({ message: 'Collaborator added successfully' });
        } catch (error) {
            next(error);
        }
    }

    async removeCollaborator(req, res, next) {
        try {
            const { project_id, user_id } = req.params;

            const collaborator = await ProjectCollaborator.findOne({
                where: { project_id, user_id }
            });

            if (!collaborator) {
                throw new AppError(404, 'Collaborator not found');
            }

            if (collaborator.role === 'owner') {
                throw new AppError(400, 'Cannot remove project owner');
            }

            await collaborator.destroy();
            logger.info(`Collaborator removed from project ${project_id}`);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProjectController();
