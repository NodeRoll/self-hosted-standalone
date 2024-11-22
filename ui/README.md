# NodeRoll UI

Modern web interface for NodeRoll, built with React and Tailwind CSS.

## Structure

```
ui/
├── components/      # Reusable UI components
├── pages/          # Page components
└── public/         # Static assets
```

## Features

- Clean, responsive design
- Real-time updates via WebSocket
- Dark/Light theme support
- Interactive deployment flow
- System monitoring dashboard

## Pages

### Dashboard
- System overview
- Quick actions
- Recent activities
- Resource usage graphs

### Deployments
- Repository selection
- Branch selection
- Environment configuration
- Deployment logs
- Rollback options

### Settings
- User preferences
- GitHub integration
- Notification settings
- System configuration

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# GitHub
VITE_GITHUB_CLIENT_ID=your_client_id

# Features
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=false
```

## Design System

We use Tailwind CSS with a custom configuration:

### Colors
- Primary: Indigo
- Secondary: Gray
- Accent: Blue
- Success: Green
- Warning: Yellow
- Error: Red

### Typography
- Headings: Inter
- Body: Inter
- Code: JetBrains Mono

### Components
All components follow these principles:
- Responsive by default
- Dark mode support
- Accessible (WCAG 2.1)
- Consistent spacing
