const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Users table
        await queryInterface.createTable('Users', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            githubId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            githubToken: {
                type: DataTypes.STRING,
                allowNull: false
            },
            role: {
                type: DataTypes.ENUM('user', 'admin'),
                defaultValue: 'user'
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        });

        // Projects table
        await queryInterface.createTable('Projects', {
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
                type: DataTypes.TEXT
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
                unique: true
            },
            envVars: {
                type: DataTypes.JSON,
                defaultValue: {}
            },
            status: {
                type: DataTypes.ENUM('active', 'inactive', 'error'),
                defaultValue: 'inactive'
            },
            lastDeployedAt: {
                type: DataTypes.DATE
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        });

        // ProjectCollaborators table
        await queryInterface.createTable('ProjectCollaborators', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            projectId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Projects',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            userId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            role: {
                type: DataTypes.ENUM('owner', 'developer'),
                defaultValue: 'developer'
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        });

        // Deployments table
        await queryInterface.createTable('Deployments', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            projectId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Projects',
                    key: 'id'
                },
                onDelete: 'CASCADE'
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
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        });

        // Add indexes
        await queryInterface.addIndex('Projects', ['domain']);
        await queryInterface.addIndex('ProjectCollaborators', ['projectId', 'userId'], { unique: true });
        await queryInterface.addIndex('Deployments', ['projectId']);
        await queryInterface.addIndex('Deployments', ['status']);
        await queryInterface.addIndex('Deployments', ['createdAt']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Deployments');
        await queryInterface.dropTable('ProjectCollaborators');
        await queryInterface.dropTable('Projects');
        await queryInterface.dropTable('Users');
    }
};
