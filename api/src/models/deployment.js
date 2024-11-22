const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const metricsSchema = {
    cpu: {
        current: {
            usage: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            system_usage: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        timeRange: {
            start: {
                type: DataTypes.DATE,
                allowNull: true
            },
            end: {
                type: DataTypes.DATE,
                allowNull: true
            }
        }
    },
    memory: {
        current: {
            usage: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            limit: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        timeRange: {
            start: {
                type: DataTypes.DATE,
                allowNull: true
            },
            end: {
                type: DataTypes.DATE,
                allowNull: true
            }
        }
    },
    network: {
        current: {
            rx_bytes: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            tx_bytes: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        timeRange: {
            start: {
                type: DataTypes.DATE,
                allowNull: true
            },
            end: {
                type: DataTypes.DATE,
                allowNull: true
            }
        }
    },
    disk: {
        current: {
            read_bytes: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            write_bytes: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        timeRange: {
            start: {
                type: DataTypes.DATE,
                allowNull: true
            },
            end: {
                type: DataTypes.DATE,
                allowNull: true
            }
        }
    }
};

const healthStatusSchema = {
    status: {
        type: DataTypes.ENUM('healthy', 'unhealthy', 'none'),
        defaultValue: 'none'
    },
    lastCheck: {
        type: DataTypes.DATE,
        allowNull: true
    },
    details: {
        type: DataTypes.JSON,
        defaultValue: {
            uptime: 0,
            restarts: 0,
            containerStatus: null
        }
    }
};

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
    status: {
        type: DataTypes.ENUM('pending', 'deploying', 'running', 'failed', 'stopped', 'unhealthy'),
        allowNull: false,
        defaultValue: 'pending'
    },
    containerId: {
        type: DataTypes.STRING,
        allowNull: true
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
            cpu: {
                limit: null,
                reservation: null
            },
            memory: {
                limit: null,
                reservation: null
            }
        }
    },
    error: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deployedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    deployedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    healthStatus: {
        type: DataTypes.JSON,
        defaultValue: healthStatusSchema
    },
    lastMetrics: {
        type: DataTypes.JSON,
        defaultValue: metricsSchema
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['projectName', 'version']
        },
        {
            fields: ['status']
        },
        {
            fields: ['deployedAt']
        }
    ]
});

// Auto-scaling related methods
Deployment.prototype.getScalingRule = async function() {
    return this.config?.scaling || null;
}

Deployment.prototype.setScalingRule = async function(rule) {
    this.config = {
        ...this.config,
        scaling: rule
    };
    await this.save();
}

Deployment.prototype.removeScalingRule = async function() {
    if (this.config?.scaling) {
        delete this.config.scaling;
        await this.save();
    }
}

Deployment.prototype.getPreviousSuccessful = async function() {
    return await Deployment.findOne({
        where: {
            projectName: this.projectName,
            status: 'success',
            id: { [sequelize.Op.lt]: this.id }
        },
        order: [['id', 'DESC']]
    });
}

Deployment.prototype.createRollback = async function(previousDeployment) {
    return await Deployment.create({
        projectName: this.projectName,
        config: previousDeployment.config,
        rollbackFromId: previousDeployment.id,
        status: 'pending'
    });
}

module.exports = Deployment;
