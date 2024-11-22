const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deployment = sequelize.define('Deployment', {
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
    commitHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    branch: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending'
    },
    logs: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    error: {
        type: DataTypes.TEXT
    },
    initiatedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    rollbackFromId: {
        type: DataTypes.UUID,
        references: {
            model: 'Deployments',
            key: 'id'
        }
    },
    startedAt: {
        type: DataTypes.DATE
    },
    completedAt: {
        type: DataTypes.DATE
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['projectId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Deployment;
