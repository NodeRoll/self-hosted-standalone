const logger = require('../../src/utils/logger');

async function cleanup(docker, projectId) {
    try {
        // Find and remove containers
        const containers = await docker.listContainers({
            all: true,
            filters: {
                name: [`noderoll-${projectId}`]
            }
        });

        for (const container of containers) {
            const containerInstance = docker.getContainer(container.Id);
            if (container.State === 'running') {
                await containerInstance.stop();
            }
            await containerInstance.remove();
            logger.info(`Removed container ${container.Id}`);
        }

        // Find and remove networks
        const networks = await docker.listNetworks({
            filters: {
                name: [`noderoll-${projectId}`]
            }
        });

        for (const network of networks) {
            const networkInstance = docker.getNetwork(network.Id);
            await networkInstance.remove();
            logger.info(`Removed network ${network.Id}`);
        }

        // Find and remove volumes
        const volumes = await docker.listVolumes({
            filters: {
                name: [`noderoll-${projectId}`]
            }
        });

        for (const volume of volumes.Volumes) {
            const volumeInstance = docker.getVolume(volume.Name);
            await volumeInstance.remove();
            logger.info(`Removed volume ${volume.Name}`);
        }

        logger.info(`Cleanup completed for project ${projectId}`);
    } catch (error) {
        logger.error(`Cleanup failed for project ${projectId}:`, error);
        throw error;
    }
}

module.exports = {
    cleanup
};
