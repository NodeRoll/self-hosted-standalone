# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to our [GitHub Security Advisories](https://github.com/NodeRoll/self-hosted-standalone/security/advisories/new). You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity.

## Security Measures

NodeRoll Self-Hosted Standalone implements several security measures:

1. **Dependency Security**
   - Regular automated security updates via Dependabot
   - Weekly dependency scans
   - Automated security patches for critical vulnerabilities

2. **Code Security**
   - Secure session management
   - Input validation and sanitization
   - Protection against common web vulnerabilities

3. **Infrastructure Security**
   - HTTPS/TLS encryption
   - Secure configuration defaults
   - Regular security audits

## Best Practices

When deploying NodeRoll Self-Hosted Standalone:

1. Always use HTTPS
2. Keep all dependencies up to date
3. Use secure environment variables
4. Follow the principle of least privilege
5. Regularly backup your data
6. Monitor system logs for suspicious activity

## Security Updates

Security updates will be automatically proposed by Dependabot. We recommend:

1. Reviewing security alerts promptly
2. Testing updates in a staging environment
3. Applying security patches as soon as possible
4. Monitoring the GitHub Security tab for advisories
