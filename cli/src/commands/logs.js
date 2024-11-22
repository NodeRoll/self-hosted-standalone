const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const WebSocket = require('ws');

async function logs(options) {
    const spinner = ora('Connecting to logs').start();

    try {
        // Get project info from local config
        const configFile = await fs.readFile('.noderoll.json', 'utf8');
        const config = JSON.parse(configFile);

        if (options.follow) {
            // WebSocket connection for real-time logs
            spinner.text = 'Establishing WebSocket connection';
            const ws = new WebSocket(\`ws://localhost:3000/api/logs/\${config.name}\`);

            ws.on('open', () => {
                spinner.succeed('Connected to log stream');
                console.log(chalk.gray('Streaming logs in real-time (Ctrl+C to exit)...\\n'));
            });

            ws.on('message', (data) => {
                const log = JSON.parse(data);
                const timestamp = new Date(log.timestamp).toISOString();
                const level = log.level.toUpperCase();
                const levelColor = {
                    'INFO': 'blue',
                    'ERROR': 'red',
                    'WARN': 'yellow',
                    'DEBUG': 'gray'
                }[level] || 'white';

                console.log(
                    chalk.gray(timestamp),
                    chalk[levelColor](level.padEnd(5)),
                    log.message
                );
            });

            ws.on('error', (error) => {
                console.error(chalk.red(\`WebSocket error: \${error.message}\`));
                process.exit(1);
            });

            ws.on('close', () => {
                console.log(chalk.gray('\\nLog stream closed'));
                process.exit(0);
            });

            // Handle Ctrl+C
            process.on('SIGINT', () => {
                ws.close();
                console.log(chalk.gray('\\nClosing log stream...'));
            });
        } else {
            // Get recent logs via HTTP
            spinner.text = 'Fetching recent logs';
            const response = await axios.get(\`http://localhost:3000/api/logs/\${config.name}\`, {
                params: {
                    limit: options.lines || 100,
                    since: options.since,
                    level: options.level
                }
            });

            spinner.succeed('Logs retrieved');

            response.data.forEach(log => {
                const timestamp = new Date(log.timestamp).toISOString();
                const level = log.level.toUpperCase();
                const levelColor = {
                    'INFO': 'blue',
                    'ERROR': 'red',
                    'WARN': 'yellow',
                    'DEBUG': 'gray'
                }[level] || 'white';

                console.log(
                    chalk.gray(timestamp),
                    chalk[levelColor](level.padEnd(5)),
                    log.message
                );
            });

            if (response.data.length === 0) {
                console.log(chalk.yellow('No logs found for the specified criteria'));
            }
        }
    } catch (error) {
        spinner.fail('Failed to retrieve logs');
        console.error(chalk.red(\`Error: \${error.message}\`));
        
        if (error.response && error.response.data) {
            console.error(chalk.red('Server response:', error.response.data));
        }
        
        process.exit(1);
    }
}

module.exports = logs;
