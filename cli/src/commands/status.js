const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const boxen = require('boxen');

async function status(options) {
    const spinner = ora('Fetching deployment status').start();

    try {
        // Get project info from local config
        const configFile = await fs.readFile('.noderoll.json', 'utf8');
        const config = JSON.parse(configFile);

        // Get deployment status
        const response = await axios.get(\`http://localhost:3000/api/status/\${config.name}\`);
        const status = response.data;

        spinner.succeed('Status retrieved');

        // Format status information
        const statusInfo = [
            \`Project: \${chalk.cyan(status.name)}\`,
            \`Status: \${getStatusBadge(status.status)}\`,
            \`Version: \${chalk.blue(status.version)}\`,
            \`Uptime: \${formatUptime(status.uptime)}\`,
            \`Last Deployed: \${new Date(status.lastDeployed).toLocaleString()}\`,
            \`URL: \${chalk.cyan(status.url)}\`,
            '',
            'Resource Usage:',
            \`  CPU: \${formatCPU(status.resources.cpu)}\`,
            \`  Memory: \${formatMemory(status.resources.memory)}\`,
            \`  Storage: \${formatStorage(status.resources.storage)}\`,
            '',
            'Health Check:',
            \`  Status: \${getHealthBadge(status.health.status)}\`,
            \`  Last Check: \${new Date(status.health.lastCheck).toLocaleString()}\`
        ].join('\\n');

        console.log(boxen(statusInfo, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        }));

        // Show recent events if any
        if (status.events && status.events.length > 0) {
            console.log(chalk.white.bold('\\nRecent Events:'));
            status.events.forEach(event => {
                const timestamp = new Date(event.timestamp).toLocaleString();
                console.log(\`\${chalk.gray(timestamp)} \${getEventIcon(event.type)} \${event.message}\`);
            });
        }

    } catch (error) {
        spinner.fail('Failed to retrieve status');
        console.error(chalk.red(\`Error: \${error.message}\`));
        
        if (error.response && error.response.data) {
            console.error(chalk.red('Server response:', error.response.data));
        }
        
        process.exit(1);
    }
}

function getStatusBadge(status) {
    const colors = {
        'running': 'green',
        'stopped': 'red',
        'deploying': 'yellow',
        'error': 'red'
    };
    return chalk[colors[status] || 'white'].bold(status.toUpperCase());
}

function getHealthBadge(health) {
    const colors = {
        'healthy': 'green',
        'unhealthy': 'red',
        'warning': 'yellow'
    };
    return chalk[colors[health] || 'white'].bold(health.toUpperCase());
}

function getEventIcon(type) {
    const icons = {
        'deploy': '🚀',
        'error': '❌',
        'restart': '🔄',
        'scale': '⚖️',
        'health': '💓'
    };
    return icons[type] || '📝';
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(\`\${days}d\`);
    if (hours > 0) parts.push(\`\${hours}h\`);
    if (minutes > 0) parts.push(\`\${minutes}m\`);
    
    return parts.join(' ') || '< 1m';
}

function formatCPU(cpu) {
    const percentage = (cpu.usage * 100).toFixed(1);
    const color = percentage > 80 ? 'red' : percentage > 60 ? 'yellow' : 'green';
    return \`\${chalk[color](\`\${percentage}%\`)} of \${cpu.limit} cores\`;
}

function formatMemory(memory) {
    const used = formatBytes(memory.used);
    const total = formatBytes(memory.limit);
    const percentage = ((memory.used / memory.limit) * 100).toFixed(1);
    const color = percentage > 80 ? 'red' : percentage > 60 ? 'yellow' : 'green';
    return \`\${chalk[color](\`\${percentage}%\`)} (\${used} of \${total})\`;
}

function formatStorage(storage) {
    const used = formatBytes(storage.used);
    const total = formatBytes(storage.limit);
    const percentage = ((storage.used / storage.limit) * 100).toFixed(1);
    const color = percentage > 80 ? 'red' : percentage > 60 ? 'yellow' : 'green';
    return \`\${chalk[color](\`\${percentage}%\`)} (\${used} of \${total})\`;
}

function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unit = 0;
    
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit++;
    }
    
    return \`\${size.toFixed(1)} \${units[unit]}\`;
}

module.exports = status;
