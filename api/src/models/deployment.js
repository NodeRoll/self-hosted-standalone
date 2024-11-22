const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deployment = sequelize.define('Deployment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    projectName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    version: {
        type: DataTypes.STRING,
        allowNull: false
    },
    containerId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'running', 'failed', 'stopped'),
        defaultValue: 'pending'
    },
    environment: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    resources: {
        type: DataTypes.JSON,
        defaultValue: {
            cpu: '0.5',
            memory: '512M'
        }
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    deployedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    deployedBy: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['projectName', 'version']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = Deployment;
