# Auto-Scaling in NodeRoll (Self-Hosted)

This guide explains how to use NodeRoll's auto-scaling capabilities in the self-hosted standalone version.

## Overview

NodeRoll monitors your system resources and GitHub repository traffic to help manage your application's performance on a single server.

## How It Works

1. **System Monitoring**:
   - CPU usage (using 1-minute load average)
   - Memory usage
   - Automatic warnings when system resources are running high

2. **GitHub Traffic**:
   - Repository views monitoring
   - Traffic-based scaling decisions
   - Cooldown periods to prevent rapid scaling

## Setting Up Auto-Scaling

### Via Web Interface

1. Navigate to your deployment's dashboard
2. Click on "Auto-Scaling" in the sidebar
3. Configure basic settings:
   - Minimum instances (default: 1)
   - Maximum instances (default: 5)
   - Cooldown period (default: 5 minutes)

### Via API

```bash
# Set scaling configuration
curl -X POST http://localhost:3000/api/deployments/your-deployment-id/scaling-rules \
  -H "Content-Type: application/json" \
  -d '{
    "minInstances": 1,
    "maxInstances": 3,
    "cooldownPeriod": 300000
  }'
```

## Scaling Behavior

### Scale Up Conditions
- GitHub traffic load > 80%
- Current instances < Maximum instances
- Not in cooldown period

### Scale Down Conditions
- GitHub traffic load < 20%
- Current instances > Minimum instances
- Not in cooldown period

### System Warnings
The system will issue warnings when:
- CPU usage > 80%
- Memory usage > 80%

## Best Practices

1. **Resource Planning**
   - Monitor system warnings
   - Upgrade server if you frequently see resource warnings
   - Keep maximum instances reasonable for your server capacity

2. **Cooldown Periods**
   - Default: 5 minutes
   - Adjust based on your application's startup time
   - Avoid too short periods to prevent thrashing

3. **Instance Limits**
   - Set based on your server's capacity
   - Consider memory usage per instance
   - Leave room for system processes

## Monitoring

Access auto-scaling logs:
```bash
# View scaling events
tail -f /var/log/noderoll/scaling.log

# View system metrics
tail -f /var/log/noderoll/metrics.log
```

## Troubleshooting

### Common Issues

1. **High Resource Usage**
   - Check system logs for warnings
   - Consider upgrading server resources
   - Optimize application code

2. **Scaling Not Working**
   - Verify GitHub token permissions
   - Check cooldown period
   - Ensure instances within min/max bounds

3. **Performance Issues**
   - Monitor application logs
   - Check for memory leaks
   - Optimize database queries

## Limitations

1. **Single Server**
   - Designed for standalone deployments
   - No cross-server orchestration
   - Resource limits based on host machine

2. **GitHub API**
   - Rate limits apply
   - Traffic data may have delays
   - Some metrics require specific permissions

Need help? Check our [community forum](https://github.com/noderoll/noderoll/discussions) or [open an issue](https://github.com/noderoll/noderoll/issues).
