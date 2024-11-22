# NodeRoll Agent

System-level operations manager for NodeRoll, handling deployments, nginx configuration, and system monitoring.

## Structure

```
agent/
├── deployment/      # Deployment management
├── nginx/          # Nginx configuration
├── ssl/            # SSL certificate management
└── monitor/        # System monitoring
```

## Features

### Deployment Management
- Application process control
- Environment setup
- Dependencies installation
- Port management
- Process monitoring (PM2)

### Nginx Management
- Virtual host configuration
- Reverse proxy setup
- Load balancer configuration
- SSL/TLS termination
- Access and error logs

### SSL Certificate Management
- Let's Encrypt integration
- Certificate generation
- Auto-renewal
- Multi-domain support
- Wildcard certificates

### System Monitoring
- Resource usage tracking
- Log aggregation
- Health checks
- Alert generation
- Metrics collection

## File Structure

```
/var/lib/noderoll/
├── apps/                  # Deployed applications
│   ├── app1/
│   │   ├── code/         # Application code
│   │   ├── logs/         # Application logs
│   │   └── .env          # Environment variables
│   └── app2/
├── nginx/                 # Nginx configurations
│   ├── sites-available/
│   └── sites-enabled/
├── ssl/                   # SSL certificates
│   ├── live/
│   └── archive/
├── logs/                  # System logs
└── backups/              # System backups
```

## Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start agent
npm run start

# Run tests
npm test
```

## Environment Variables

```env
# Agent Configuration
PORT=3002
NODE_ENV=production

# API Communication
API_URL=http://localhost:3000
API_SECRET=your_api_secret

# Paths
APPS_PATH=/var/lib/noderoll/apps
NGINX_PATH=/etc/nginx
SSL_PATH=/var/lib/noderoll/ssl

# Let's Encrypt
LETSENCRYPT_EMAIL=admin@example.com

# System
MAX_MEMORY_PER_APP=512M
MAX_CPU_PER_APP=1
```

## Security

The agent requires elevated privileges for:
- Process management
- Nginx configuration
- SSL certificate management
- Port binding (80/443)

Ensure proper security measures:
- Regular system updates
- Secure API communication
- Limited file permissions
- Process isolation
