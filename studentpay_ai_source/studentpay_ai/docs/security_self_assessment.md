# Security self-assessment — prototype

## Controls present
- Passwords are hashed with bcrypt, not stored in plain text.
- Password length minimum is 12 characters.
- Basic failed-login throttling is implemented.
- SQL statements use placeholders for user-provided values.
- Saved comparisons are queried by authenticated user ID.
- Financial values are checked for valid numeric ranges.
- Audit events record event types without passwords or transaction credentials.
- The prototype is simulation-only.

## Known risks and gaps
- Authentication and Streamlit session handling are not production-grade.
- No MFA, email verification, account recovery, or robust bot protection.
- Login throttling is basic and can be bypassed in multi-process deployments.
- SQLite file encryption is not configured.
- No live FX data verification, provider verification, or payment execution.
- No LLM integration; prompt-injection controls are not applicable until an AI model is added.
- No formal penetration test or independent security audit has been performed.

## Risk treatment before deployment
- Use a reviewed identity provider or mature authentication framework.
- Add MFA and secure session/cookie settings.
- Use HTTPS, managed secrets, encryption at rest, backups, monitoring, and least-privilege access.
- Add dependency scanning, automated security tests, privacy retention rules, and incident response.
- For any future AI/payment integration, validate model output, restrict tools to least privilege, require explicit user confirmation, and never let the model directly authorize transfers.
