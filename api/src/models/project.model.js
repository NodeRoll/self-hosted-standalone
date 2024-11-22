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
    githubRepo: {
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
    envVars: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'error'),
        defaultValue: 'inactive',
        allowNull: false
    },
    lastDeployedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        { unique: true, fields: ['domain'] }
    ]
});

// Instance methods
Project.prototype.toJSON = function() {
    const values = { ...this.get() };
    // Remove sensitive data from JSON response
    delete values.envVars;
    return values;
};

module.exports = Project;
