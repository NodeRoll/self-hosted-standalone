# NodeRoll Installation Guide

This guide will help you install and configure NodeRoll for your environment.

## Prerequisites

### System Requirements
- Node.js v14 or higher
- 512MB RAM minimum (1GB recommended)
- 1GB free disk space
- Docker (optional, for container deployments)
- PM2 (optional, for process management)
- Nginx (will be installed automatically if not present)

### Development Tools
- Git
- npm or yarn
- A code editor (VS Code recommended)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/NodeRoll/self-hosted-standalone.git
cd self-hosted-standalone
```

### 2. Install Dependencies

```bash
# Install API dependencies
cd api
npm install
cp .env.example .env

# Install Agent dependencies
cd ../agent
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

#### API Configuration (.env)
```env
# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Database Configuration
DB_PATH=data/noderoll.db

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

#### Agent Configuration
```env
# Agent Configuration
AGENT_PORT=3001
API_URL=http://localhost:3000
AGENT_TOKEN=your-agent-token

# Deployment Configuration
APPS_DIR=/var/lib/noderoll/apps
NGINX_DIR=/etc/nginx
```

### 4. Initialize Database

```bash
cd api
npm run db:migrate
npm run db:seed
```

### 5. Start Services

#### Development Mode
```bash
# Start API server
cd api
npm run dev

# Start Agent
cd ../agent
npm run dev

# Start Frontend
cd ../frontend
npm run dev
```

#### Production Mode
```bash
# Start API server
cd api
npm run start

# Start Agent
cd ../agent
npm run start

# Build and serve frontend
cd ../frontend
npm run build
```

## Verification

1. API server should be running on http://localhost:3000
2. Agent should be running on http://localhost:3001
3. Frontend should be accessible on http://localhost:5173 (dev) or your configured production URL

## Common Issues

### Port Conflicts
- Ensure ports 3000, 3001, and 5173 are available
- Modify port numbers in configuration if needed

### Permission Issues
- Ensure proper file permissions for the application directories
- Run with sudo/administrator privileges when needed

### Database Issues
- Verify SQLite installation
- Check database file permissions
- Ensure database migrations are run

## Next Steps

1. [Configure GitHub OAuth](../security/SECURITY.md#github-oauth)
2. [Set up SSL certificates](../security/SECURITY.md#ssl-certificates)
3. [Configure deployment strategies](../deployment/STRATEGIES.md)
4. [Set up monitoring](../monitoring/MONITORING.md)
