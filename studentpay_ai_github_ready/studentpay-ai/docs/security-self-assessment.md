# Security Self-Assessment

## Controls included

- Password hashing with bcrypt
- Minimum password length
- Basic failed-login throttling
- Parameterized SQL queries
- Per-user filtering for saved comparisons
- Numeric input validation
- Basic audit events that avoid storing passwords
- Simulation-only financial calculations

## Known gaps

- Authentication and session management are not production-grade.
- MFA, account recovery, and email verification are absent.
- Rate limiting is basic and not suitable for multi-instance deployment.
- Database encryption at rest is not configured.
- No AI model, live FX provider, or payment integration is included.
- No independent penetration test has been performed.

## Recommended before deployment

Add reviewed authentication, MFA, HTTPS, managed secrets, encryption and backups, privacy/data-retention controls, dependency scanning, monitoring, incident response, and independent security review. Any future AI or payment integration must have least-privilege access, strict input/output validation, explicit user confirmation, and compliance review.
