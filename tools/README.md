# NodeRoll Tools

Utility scripts and tools for NodeRoll system management.

## Structure

```
tools/
├── setup/          # Installation and setup scripts
├── backup/         # Backup and restore tools
└── maintenance/    # System maintenance tools
```

## Setup Tools

### System Setup
- `install.sh` - Main installation script
- `configure-nginx.sh` - Nginx configuration
- `configure-mongodb.sh` - MongoDB setup
- `setup-ssl.sh` - Initial SSL setup

### Development Setup
- `dev-setup.sh` - Development environment setup
- `generate-keys.sh` - Generate development keys
- `setup-hooks.sh` - Git hooks setup

## Backup Tools

### Database Backup
- `backup-db.sh` - MongoDB backup script
- `restore-db.sh` - MongoDB restore script
- `rotate-backups.sh` - Cleanup old backups

### System Backup
- `backup-apps.sh` - Backup deployed applications
- `backup-config.sh` - Backup system configuration
- `backup-ssl.sh` - Backup SSL certificates

## Maintenance Tools

### System Maintenance
- `check-disk.sh` - Disk space monitoring
- `cleanup-logs.sh` - Log rotation
- `update-ssl.sh` - SSL certificate renewal

### Application Maintenance
- `cleanup-apps.sh` - Remove unused applications
- `check-ports.sh` - Port usage analysis
- `monitor-resources.sh` - Resource usage check

## Usage

Most scripts require root privileges:

```bash
# System installation
sudo ./tools/setup/install.sh

# Create backup
sudo ./tools/backup/backup-all.sh

# Maintenance check
sudo ./tools/maintenance/system-check.sh
```

## Configuration

Scripts read configuration from `/etc/noderoll/config`:

```env
# Backup Configuration
BACKUP_DIR=/var/backups/noderoll
KEEP_BACKUPS=7
COMPRESS_BACKUPS=true

# MongoDB
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=noderoll

# System
LOG_DIR=/var/log/noderoll
MAX_LOG_SIZE=100M
ALERT_DISK_USAGE=85
```

## Security Notes

- All scripts must be run as root
- Backup files are encrypted
- Sensitive data is handled securely
- Logs contain execution history
