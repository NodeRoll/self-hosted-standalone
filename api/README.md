# NodeRoll API Server

NodeRoll API Server is a powerful Node.js deployment platform that supports both Docker-based and file-based deployments.

## Features

- GitHub integration for repository management
- Multiple deployment strategies (Docker and PM2)
- Project and user management
- Deployment history and logs
- Environment variable management
- Health monitoring

## Prerequisites

- Node.js >= 14
- SQLite3
- Docker (optional, for Docker-based deployments)
- PM2 (optional, for file-based deployments)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/noderoll.git
cd noderoll/api
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database Configuration
DB_PATH=data/noderoll.db

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Agent Configuration
AGENT_SECRET=your-agent-secret-key
```

5. Run setup script:
```bash
npm run setup
```

## Development

Start the development server:
```bash
npm run dev
```

## Production

Start the production server:
```bash
npm start
```

## Testing

Run tests:
```bash
npm test
```

## License

MIT
