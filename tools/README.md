# NodeRoll Tools

This directory contains utility scripts for NodeRoll deployment platform.

## Installation

1. Make scripts executable:
```bash
chmod +x *.sh
```

2. Add tools directory to PATH (optional):
```bash
export PATH=$PATH:/path/to/noderoll/tools
```

## Available Tools

### Setup Scripts
- `setup-docker.sh` - Docker setup and configuration
- `setup-pm2.sh` - PM2 setup and configuration

### Deployment Scripts
- `deploy.sh` - Main deployment script
- `rollback.sh` - Rollback deployment
- `cleanup.sh` - Clean old deployments

### Monitoring Scripts
- `monitor.sh` - System monitoring script
- `check-health.sh` - Health check script
- `view-logs.sh` - Log viewer script

### Maintenance Scripts
- `backup.sh` - Backup script
- `restore.sh` - Restore script
- `rotate-logs.sh` - Log rotation script

## Usage

Each script includes help information accessible via `-h` or `--help` flag:

```bash
./script-name.sh --help
```

## Configuration

Scripts read configuration from environment variables or `.env` file. Copy the example configuration:

```bash
cp .env.example .env
```

## License

MIT
