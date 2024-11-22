# 🔌 NodeRoll API Documentation

> Complete API reference for NodeRoll deployment platform

## 📚 Table of Contents

- [Authentication](#-authentication)
- [Deployments](#-deployments)
- [Auto-Scaling](#-auto-scaling)
- [Monitoring](#-monitoring)
- [Error Handling](#-error-handling)

## 🔐 Authentication

All API requests require authentication using JWT tokens.

### Request Headers
```
Authorization: Bearer <your_jwt_token>
```

### Error Response Format
```json
{
  "error": "string",
  "message": "string",
  "statusCode": number
}
```

## 🚀 Deployments

### Create Deployment
```http
POST /api/v1/deployments
```

**Request Body:**
```json
{
  "name": "my-app",
  "repository": "https://github.com/user/repo",
  "branch": "main",
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3000"
  },
  "resources": {
    "cpu": "0.5",
    "memory": "512M"
  },
  "scaling": {
    "min": 1,
    "max": 5,
    "rules": [
      {
        "metric": "cpu",
        "operator": ">",
        "threshold": 80,
        "duration": "5m",
        "action": "scale_up"
      }
    ]
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "dep_123xyz",
  "status": "creating",
  "createdAt": "2023-01-01T00:00:00Z",
  "url": "https://my-app.noderoll.dev"
}
```

### Get Deployment Status
```http
GET /api/v1/deployments/{id}
```

**Response:** `200 OK`
```json
{
  "id": "dep_123xyz",
  "status": "running",
  "health": {
    "status": "healthy",
    "lastCheck": "2023-01-01T00:05:00Z"
  },
  "metrics": {
    "cpu": 45,
    "memory": 128,
    "requests": 150
  },
  "instances": 2
}
```

### Stop Deployment
```http
POST /api/v1/deployments/{id}/stop
```

**Response:** `200 OK`
```json
{
  "id": "dep_123xyz",
  "status": "stopped",
  "stoppedAt": "2023-01-01T01:00:00Z"
}
```

### Rollback Deployment
```http
POST /api/v1/deployments/{id}/rollback
```

**Response:** `200 OK`
```json
{
  "id": "dep_123xyz",
  "status": "rolling_back",
  "version": {
    "current": "v2",
    "target": "v1"
  }
}
```

## ⚖️ Auto-Scaling

### Add Scaling Rule
```http
POST /api/v1/deployments/{id}/scaling/rules
```

**Request Body:**
```json
{
  "metric": "cpu",
  "operator": ">",
  "threshold": 80,
  "duration": "5m",
  "action": "scale_up",
  "cooldown": "3m"
}
```

**Response:** `201 Created`
```json
{
  "id": "rule_abc123",
  "status": "active",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### List Scaling Rules
```http
GET /api/v1/deployments/{id}/scaling/rules
```

**Response:** `200 OK`
```json
{
  "rules": [
    {
      "id": "rule_abc123",
      "metric": "cpu",
      "operator": ">",
      "threshold": 80,
      "duration": "5m",
      "action": "scale_up",
      "cooldown": "3m",
      "status": "active"
    }
  ]
}
```

### Delete Scaling Rule
```http
DELETE /api/v1/deployments/{id}/scaling/rules/{ruleId}
```

**Response:** `204 No Content`

## 📊 Monitoring

### Get Metrics
```http
GET /api/v1/deployments/{id}/metrics
```

**Query Parameters:**
- `from` (ISO date)
- `to` (ISO date)
- `metrics[]` (array of metric names)

**Response:** `200 OK`
```json
{
  "metrics": {
    "cpu": [
      {
        "timestamp": "2023-01-01T00:00:00Z",
        "value": 45
      }
    ],
    "memory": [
      {
        "timestamp": "2023-01-01T00:00:00Z",
        "value": 128
      }
    ]
  }
}
```

### Get Deployment Logs
```http
GET /api/v1/deployments/{id}/logs
```

**Query Parameters:**
- `limit` (default: 100)
- `from` (ISO date)
- `level` (debug|info|warn|error)

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "timestamp": "2023-01-01T00:00:00Z",
      "level": "info",
      "message": "Deployment started",
      "metadata": {
        "instance": "i-123xyz"
      }
    }
  ]
}
```

## ❌ Error Handling

### Common Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource state conflict |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Response Example
```json
{
  "error": "ValidationError",
  "message": "Invalid scaling rule configuration",
  "details": {
    "field": "threshold",
    "reason": "Must be between 0 and 100"
  },
  "statusCode": 422
}
```

## 🔄 Rate Limiting

API requests are limited to:
- 1000 requests per hour per IP
- 100 requests per minute per deployment

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 📝 Webhook Events

NodeRoll can send webhook notifications for various events:

### Event Types

| Event | Description |
|-------|-------------|
| `deployment.created` | New deployment created |
| `deployment.started` | Deployment started |
| `deployment.completed` | Deployment completed |
| `deployment.failed` | Deployment failed |
| `instance.scaled` | Scaling event occurred |
| `alert.triggered` | Monitoring alert triggered |

### Webhook Payload Example
```json
{
  "event": "deployment.completed",
  "timestamp": "2023-01-01T00:00:00Z",
  "data": {
    "deploymentId": "dep_123xyz",
    "status": "success",
    "duration": 45,
    "url": "https://my-app.noderoll.dev"
  }
}
```

## 🔗 SDK & Client Libraries

Official client libraries are under development.

## 📚 Further Reading

- [Development Guide](../development/DEVELOPMENT.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Deployment Strategies](../deployment/STRATEGIES.md)
- [Monitoring Guide](../monitoring/MONITORING.md)
