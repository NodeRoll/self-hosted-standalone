const sequelize = require('../config/database');

// Import models
const User = require('./user.model');
const Project = require('./project.model');
const ProjectCollaborator = require('./project-collaborator.model');
const Deployment = require('./deployment.model');

// Define associations after all models are loaded
const defineAssociations = () => {
    // User-Project owner relationships
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
};

// Define associations
defineAssociations();

module.exports = {
    sequelize,
    User,
    Project,
    ProjectCollaborator,
    Deployment
};
