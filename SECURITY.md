# Security policy and threat model

## Security controls

The API uses httpOnly secure session cookies, short-lived access tokens and rotating hashed refresh tokens. State-changing routes require an allowed Origin/Referer and a double-submit CSRF header. Zod rejects unknown input fields, Mongo query operators are sanitized, text is escaped and rendered as text, and all resource authorization is server-side.

Feed responses intentionally omit phone numbers. Contact reveal requires authentication, request ownership or donor eligibility, route-specific rate limits, and creates an audit record. Authentication routes prevent enumeration, hash OTPs, impose resend/attempt limits, and never log secrets.

## Threats considered

- Token theft/XSS: httpOnly cookies, CSP, no local storage, token rotation and secret redaction.
- CSRF: origin enforcement plus `x-csrf-token` double-submit check.
- NoSQL injection and malformed input: strict schemas and recursive key sanitization.
- Scraping/abuse: rate limits, contact audit trail, active-request limit, request cooldown and Turnstile.
- Account takeover: verified Google tokens or expiring single-use email OTPs; refresh-token reuse revokes the whole family.
- Privacy: contact information is hidden until eligibility is established; deleting an account deletes its related records.

## Reporting

Do not file public issues for vulnerabilities. Send a private report to the deployment operator with reproduction steps and impact. Rotate all affected credentials when responding.
