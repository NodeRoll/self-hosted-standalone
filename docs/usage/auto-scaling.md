# Using Auto-Scaling in NodeRoll

This guide explains how to use NodeRoll's intelligent auto-scaling system to optimize your application's performance.

## Overview

NodeRoll's auto-scaling system monitors both system metrics and GitHub activity to automatically adjust your application's resources based on demand.

## Setting Up Auto-Scaling

### Via Web Interface

1. Navigate to your deployment's dashboard
2. Click on "Auto-Scaling" in the sidebar
3. Click "Configure Rules"
4. Set your scaling parameters:
   - Minimum instances
   - Maximum instances
   - Cooldown period
   - Scaling rules

### Via API

```bash
# Set scaling rules
curl -X POST http://your-server/api/deployments/your-deployment-id/scaling-rules \
  -H "Content-Type: application/json" \
  -d '{
    "minInstances": 1,
    "maxInstances": 5,
    "cooldownPeriod": 300000,
    "metrics": [
      {
        "type": "cpu",
        "threshold": 80,
        "action": "scale-up"
      }
    ]
  }'
```

## Metric Types

### System Metrics

- **CPU Usage**: Scales based on CPU utilization
- **Memory Usage**: Scales based on memory consumption
- **Disk Usage**: Scales based on disk space utilization
- **Network Traffic**: Scales based on network load

### GitHub Metrics

- **Commit Frequency**: Scales based on repository activity
- **Active Pull Requests**: Scales based on PR workload
- **Active Issues**: Scales based on issue activity
- **Traffic Load**: Scales based on repository views

## Best Practices

### General Guidelines

1. **Start Conservative**
   - Begin with wider thresholds
   - Gradually tighten as you understand patterns

2. **Use Multiple Metrics**
   - Combine system and GitHub metrics
   - Create balanced scaling rules

3. **Set Appropriate Cooldowns**
   - Prevent scaling thrashing
   - Default: 5 minutes (300000ms)

### Example Configurations

#### Development Environment
```json
{
  "minInstances": 1,
  "maxInstances": 3,
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

#### Production Environment
```json
{
  "minInstances": 2,
  "maxInstances": 10,
  "cooldownPeriod": 300000,
  "metrics": [
    {
      "type": "cpu",
      "threshold": 70,
      "action": "scale-up"
    },
    {
      "type": "memory",
      "threshold": 80,
      "action": "scale-up"
    },
    {
      "type": "traffic_load",
      "threshold": 100,
      "action": "scale-up"
    }
  ]
}
```

## Monitoring Auto-Scaling

### Dashboard Metrics

Monitor your auto-scaling activity through:
- Scaling event history
- Resource utilization graphs
- GitHub activity correlation
- Performance impact analysis

### Logs

Access auto-scaling logs:
```bash
# View scaling events
tail -f /var/log/noderoll/scaling.log

# View detailed metrics
tail -f /var/log/noderoll/metrics.log
```

## Troubleshooting

### Common Issues

1. **Frequent Scaling**
   - Increase cooldown period
   - Adjust thresholds
   - Review metric combinations

2. **Delayed Scaling**
   - Decrease cooldown period
   - Lower thresholds
   - Check metric collection

3. **Resource Constraints**
   - Verify server capacity
   - Adjust maximum instances
   - Review resource allocation

### Getting Help

- Check the [API Documentation](../api/auto-scaling.md)
- Join our [Discord Community](https://discord.gg/noderoll)
- Open an [Issue](https://github.com/NodeRoll/self-hosted-standalone/issues)
