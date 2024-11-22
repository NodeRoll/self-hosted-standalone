const sequelize = require('../config/database');
const User = require('./user.model');
const Project = require('./project.model');
const ProjectCollaborator = require('./project-collaborator.model');
const Deployment = require('./deployment.model');

// User-Project relationships
Project.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(Project, { as: 'ownedProjects', foreignKey: 'ownerId' });

// Project-Collaborator relationships
Project.belongsToMany(User, { through: ProjectCollaborator, as: 'collaborators' });
User.belongsToMany(Project, { through: ProjectCollaborator, as: 'projects' });

// Deployment relationships
Project.hasMany(Deployment, { foreignKey: 'projectId' });
Deployment.belongsTo(Project, { foreignKey: 'projectId' });
User.hasMany(Deployment, { foreignKey: 'initiatedBy' });
Deployment.belongsTo(User, { foreignKey: 'initiatedBy', as: 'initiator' });
Deployment.belongsTo(Deployment, { as: 'rollbackFrom', foreignKey: 'rollbackFromId' });

module.exports = {
    sequelize,
    User,
    Project,
    ProjectCollaborator,
    Deployment
};
