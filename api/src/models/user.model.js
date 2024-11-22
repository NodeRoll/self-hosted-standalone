const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    githubId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false
    },
    avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        { unique: true, fields: ['githubId'] },
        { unique: true, fields: ['email'] }
    ]
});

// Instance methods
User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.createdAt;
    delete values.updatedAt;
    return values;
};

// Static methods
User.findByGithubId = async function(githubId) {
    return await this.findOne({ where: { githubId } });
};

module.exports = User;
