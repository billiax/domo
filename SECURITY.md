# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.6.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do NOT open public issues for security vulnerabilities.**

Use GitHub's [private vulnerability reporting](https://github.com/billiax/domo/security/advisories/new) feature to report security issues.

### Response Timeline

- **Acknowledge:** Within 48 hours
- **Status update:** Within 7 days
- **Fix for critical issues:** Within 30 days

### Scope

In scope:
- Content script injection and isolation
- Plugin JS execution in MAIN world
- Cross-world messaging (postMessage)
- Storage data validation and sanitization
- Background script message handling
- Cross-origin fetch proxy

Out of scope:
- Chrome browser vulnerabilities
- Third-party website bugs
- Issues in optional backend (localhost-only, no auth)
- Plugin code written by users (runs in MAIN world by design)

## Disclosure

We follow coordinated disclosure. We will credit reporters in the release notes (unless anonymity is requested).
