# NodeRoll API Server

The API server is the core component of NodeRoll, handling all business logic and data operations.

## Structure

```
api/
├── routes/          # API route definitions
├── controllers/     # Request handlers
├── middleware/      # Express middleware
└── services/        # Business logic services
```

## Key Features

- GitHub OAuth integration
- Repository management
- Deployment coordination
- System monitoring
- Real-time updates via WebSocket

## Technical Stack

- Node.js & Express
- MongoDB for data storage
- JWT for authentication
- WebSocket for real-time updates
- PM2 for process management

## API Endpoints

### Authentication
- `POST /auth/github` - GitHub OAuth flow
- `POST /auth/refresh` - Refresh JWT token

### Repositories
- `GET /repos` - List connected repositories
- `POST /repos/connect` - Connect new repository
- `DELETE /repos/:id` - Remove repository

### Deployments
- `POST /deploy` - Start new deployment
- `GET /deploy/:id` - Get deployment status
- `POST /deploy/:id/rollback` - Rollback deployment

### System
- `GET /system/status` - Get system status
- `GET /system/logs` - Get system logs
- `GET /system/metrics` - Get system metrics

## Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test
```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/noderoll

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Agent Communication
AGENT_SECRET=your_agent_secret
```
