const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

const isTest = process.env.NODE_ENV === 'test';
const dbPath = isTest ? ':memory:' : path.join(__dirname, '../../data/noderoll.db');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: isTest ? false : msg => logger.debug(msg),
    define: {
        timestamps: true,
        underscored: true
    }
});

module.exports = sequelize;
