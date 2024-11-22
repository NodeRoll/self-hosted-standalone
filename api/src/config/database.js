const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

const dbPath = path.join(__dirname, '../../data/noderoll.db');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: msg => logger.debug(msg),
    define: {
        timestamps: true,
        underscored: true
    }
});

module.exports = sequelize;
