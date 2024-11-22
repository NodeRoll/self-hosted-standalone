const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    github_repo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    branch: {
        type: DataTypes.STRING,
        defaultValue: 'main',
        allowNull: false
    },
    domain: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    env_vars: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'error'),
        defaultValue: 'inactive',
        allowNull: false
    },
    runtime_config: {
        type: DataTypes.JSON,
        defaultValue: {
            nodeVersion: '18-slim',
            startCommand: 'npm start',
            buildCommand: 'npm ci --only=production',
            resourceLimits: {
                memory: '512M',
                cpus: '0.5',
                storage: '1G'
            }
        },
        allowNull: false
    },
    last_deployed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    owner_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'projects',
    indexes: [
        { unique: true, fields: ['domain'] }
    ]
});

// Instance methods
Project.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
};

module.exports = Project;
