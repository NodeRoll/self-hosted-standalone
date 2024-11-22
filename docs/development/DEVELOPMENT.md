# NodeRoll Development Guide

This guide provides information for developers who want to contribute to NodeRoll.

## Architecture Overview

NodeRoll consists of three main components:

1. **API Server**: Core backend service
2. **Agent**: System-level operations manager
3. **Frontend**: React-based user interface

## Development Setup

### Prerequisites

- Node.js v14 or higher
- npm or yarn
- Git
- Docker (optional)
- VS Code (recommended)

### Local Development Environment

1. Clone the repository:
```bash
git clone https://github.com/NodeRoll/self-hosted-standalone.git
cd self-hosted-standalone
```

2. Install dependencies for all components:
```bash
# API
cd api
npm install

# Agent
cd ../agent
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# API
cd api
cp .env.example .env

# Agent
cd ../agent
cp .env.example .env
```

4. Start development servers:
```bash
# API
cd api
npm run dev

# Agent
cd ../agent
npm run dev

# Frontend
cd ../frontend
npm run dev
```

## Code Structure

### API Server

```
api/
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
└── utils/          # Helper functions
```

### Agent

```
agent/
├── deployment/     # Deployment logic
├── monitor/       # System monitoring
├── nginx/         # Nginx management
└── ssl/           # SSL certificate handling
```

### Frontend

```
frontend/
├── src/
│   ├── components/ # React components
│   ├── hooks/      # Custom hooks
│   ├── pages/      # Page components
│   ├── store/      # State management
│   └── utils/      # Helper functions
```

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages
- Add JSDoc comments for functions

### Testing

1. Unit Tests:
```bash
# API
cd api
npm run test

# Agent
cd ../agent
npm run test

# Frontend
cd ../frontend
npm run test
```

2. Integration Tests:
```bash
npm run test:integration
```

3. End-to-End Tests:
```bash
npm run test:e2e
```

### Documentation

- Update README.md when adding features
- Document API endpoints
- Add JSDoc comments
- Update TypeScript types
- Keep docs/ up to date

### Git Workflow

1. Create feature branch:
```bash
git checkout -b feature/your-feature
```

2. Make changes and commit:
```bash
git add .
git commit -m "feat: your feature description"
```

3. Push changes:
```bash
git push origin feature/your-feature
```

4. Create pull request

### Pull Request Guidelines

- Reference related issues
- Provide clear description
- Include test coverage
- Update documentation
- Follow code style
- Add screenshots if UI changes

## Debugging

### API Server

1. Using VS Code:
   - Use launch configuration
   - Set breakpoints
   - Use debug console

2. Using Chrome DevTools:
```bash
cd api
npm run dev:debug
```

### Frontend

1. React Developer Tools:
   - Install browser extension
   - Use Components tab
   - Monitor state changes

2. Network Debugging:
   - Use browser DevTools
   - Monitor API calls
   - Check WebSocket connections

## Building for Production

### API Server

```bash
cd api
npm run build
```

### Frontend

```bash
cd frontend
npm run build
```

### Agent

```bash
cd agent
npm run build
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update documentation
6. Create pull request

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed guidelines.
