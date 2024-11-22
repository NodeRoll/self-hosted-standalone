# Auto-Scaling API Documentation

## Endpoints

### Get Scaling Rules

```http
GET /api/deployments/:id/scaling-rules
```

Returns the current auto-scaling rules for a deployment.

#### Response

```json
{
  "minInstances": 1,
  "maxInstances": 5,
  "cooldownPeriod": 300000,
  "metrics": [
    {
      "type": "cpu",
      "threshold": 80,
      "action": "scale-up"
    },
    {
      "type": "commit_frequency",
      "threshold": 10,
      "action": "scale-up"
    }
  ]
}
```

### Set Scaling Rules

```http
POST /api/deployments/:id/scaling-rules
```

Configure auto-scaling rules for a deployment.

#### Request Body

```json
{
  "minInstances": 1,
  "maxInstances": 5,
  "cooldownPeriod": 300000,
  "metrics": [
    {
      "type": "cpu",
      "threshold": 80,
      "action": "scale-up"
    },
    {
      "type": "memory",
      "threshold": 90,
      "action": "scale-up"
    },
    {
      "type": "commit_frequency",
      "threshold": 10,
      "action": "scale-up"
    },
    {
      "type": "active_prs",
      "threshold": 5,
      "action": "scale-up"
    }
  ]
}
```

### Remove Scaling Rules

```http
DELETE /api/deployments/:id/scaling-rules
```

Remove auto-scaling rules from a deployment.

## Metric Types

### System Metrics

| Type | Description | Unit |
|------|-------------|------|
| `cpu` | CPU usage | Percentage (0-100) |
| `memory` | Memory usage | Percentage (0-100) |
| `disk` | Disk usage | Percentage (0-100) |
| `network` | Network traffic | MB/s |

### GitHub Metrics

| Type | Description | Unit |
|------|-------------|------|
| `commit_frequency` | Commits per hour | Number |
| `active_prs` | Active pull requests | Number |
| `active_issues` | Active issues | Number |
| `traffic_load` | Repository views per hour | Number |

## Scaling Actions

| Action | Description |
|--------|-------------|
| `scale-up` | Increase instances by 1 |
| `scale-down` | Decrease instances by 1 |

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request body |
| 404 | Deployment not found |
| 429 | Too many scaling requests |
