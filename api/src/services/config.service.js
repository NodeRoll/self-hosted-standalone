const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class ConfigService {
    async loadProjectConfig(workDir) {
        try {
            // Try to load .noderoll.json first
            try {
                const jsonConfig = await fs.readFile(path.join(workDir, '.noderoll.json'), 'utf8');
                return JSON.parse(jsonConfig);
            } catch (error) {
                // If .noderoll.json doesn't exist, try .noderoll.yml
                const yamlConfig = await fs.readFile(path.join(workDir, '.noderoll.yml'), 'utf8');
                return yaml.load(yamlConfig);
            }
        } catch (error) {
            logger.warn('No .noderoll config file found, using defaults');
            return this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            type: 'nodejs',
            engine: {
                node: '18-slim'
            },
            scripts: {
                build: 'npm ci --only=production',
                start: 'npm start'
            },
            resources: {
                memory: '512M',
                cpus: '0.5',
                storage: '1G'
            },
            healthCheck: {
                path: '/health',
                interval: '30s',
                timeout: '5s',
                retries: 3
            }
        };
    }

    validateConfig(config) {
        const requiredFields = ['type', 'engine', 'scripts'];
        const missingFields = requiredFields.filter(field => !config[field]);
        
        if (missingFields.length > 0) {
            throw new AppError(400, `Missing required fields in .noderoll config: ${missingFields.join(', ')}`);
        }

        if (config.type !== 'nodejs') {
            throw new AppError(400, 'Only nodejs type is supported currently');
        }

        // Validate scripts
        if (!config.scripts.start) {
            throw new AppError(400, 'Start script is required in .noderoll config');
        }

        return true;
    }

    convertToRuntimeConfig(config) {
        return {
            nodeVersion: config.engine.node,
            startCommand: config.scripts.start,
            buildCommand: config.scripts.build,
            resourceLimits: config.resources,
            healthCheck: config.healthCheck,
            hooks: config.hooks || {}
        };
    }

    async processHooks(config, stage, workDir) {
        if (!config.hooks || !config.hooks[stage]) {
            return;
        }

        const command = config.hooks[stage];
        logger.info(`Running ${stage} hook: ${command}`);
        
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);
            
            await execAsync(command, { cwd: workDir });
            logger.info(`${stage} hook completed successfully`);
        } catch (error) {
            throw new AppError(500, `${stage} hook failed: ${error.message}`);
        }
    }
}

module.exports = new ConfigService();
