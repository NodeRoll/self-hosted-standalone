const path = require('path');
const fs = require('fs').promises;
const DockerStrategy = require('./docker.strategy');
const FileStrategy = require('./file.strategy');
const { AppError } = require('../../middleware/errorHandler');

class DeploymentStrategyFactory {
    static async createStrategy(deployment, project) {
        const workDir = path.join(process.env.WORKSPACE_DIR || '/tmp/noderoll', project.id, deployment.id);

        try {
            // Check for Dockerfile
            const hasDockerfile = await this.fileExists(path.join(workDir, 'Dockerfile'));
            
            // Check for package.json
            const hasPackageJson = await this.fileExists(path.join(workDir, 'package.json'));

            if (!hasDockerfile && !hasPackageJson) {
                throw new AppError(400, 'Neither Dockerfile nor package.json found in repository');
            }

            // Prefer Docker deployment if Dockerfile exists
            if (hasDockerfile) {
                return new DockerStrategy(deployment, project);
            }

            return new FileStrategy(deployment, project);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to determine deployment strategy');
        }
    }

    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = DeploymentStrategyFactory;
