const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectCollaborator = sequelize.define('ProjectCollaborator', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Projects',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    role: {
        type: DataTypes.ENUM('owner', 'collaborator', 'viewer'),
        defaultValue: 'collaborator',
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        { unique: true, fields: ['projectId', 'userId'] }
    ]
});

module.exports = ProjectCollaborator;
