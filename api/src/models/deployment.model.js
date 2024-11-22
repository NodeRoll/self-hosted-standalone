const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const scalingRulesSchema = {
    minInstances: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    maxInstances: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    cooldownPeriod: {
        type: DataTypes.INTEGER,
        defaultValue: 300000 // 5 minutes in milliseconds
    },
    rules: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    lastScalingAction: {
        type: DataTypes.DATE
    }
};

const Deployment = sequelize.define('Deployment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Projects',
            key: 'id'
        }
    },
    commit_hash: {
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
    initiated_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    rollback_from_id: {
        type: DataTypes.UUID,
        references: {
            model: 'Deployments',
            key: 'id'
        }
    },
    started_at: {
        type: DataTypes.DATE
    },
    completed_at: {
        type: DataTypes.DATE
    },
    ...scalingRulesSchema
}, {
    timestamps: true,
    tableName: 'Deployments',
    underscored: true,
    indexes: [
        {
            fields: ['project_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = Deployment;
