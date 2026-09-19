# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | yes       |

## Reporting a Vulnerability

If you discover a security issue, please **do not** open a public GitHub issue.

Email details to the repository owner with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to acknowledge reports within 48 hours.

## Security Architecture

DocuIntel implements defense in depth:

- **Authentication:** Auth.js (Google, Apple, credentials) with HTTP-only JWT cookies (`docuintel-token`)
- **Authorization:** Middleware verifies JWT and injects trusted `X-User-Id` headers; client-supplied identity headers are stripped
- **Rate limiting:** Login, register, and password-reset endpoints are rate-limited per IP
- **Input validation:** Zod schemas on all auth payloads
- **OAuth CSRF:** Signed `state` parameter on Google Drive and DocuSign integration flows
- **Billing webhooks:** Stripe signature verification; webhook route bypasses JWT middleware
- **HTTP headers:** CSP, HSTS, X-Frame-Options, Referrer-Policy via Next.js config
- **CORS:** Restricted to `NEXT_PUBLIC_APP_URL` in production
- **Secrets:** `AUTH_SECRET` / `JWT_SECRET` required in production; no default fallback
- **Password policy:** Minimum 8 characters, letter + number, bcrypt cost 12
- **Demo accounts:** Disabled in production unless explicitly enabled; guest users TTL-expire after 24h

## Deployment Checklist

- [ ] Set strong `AUTH_SECRET` and `JWT_SECRET` (32+ random characters)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Configure separate OAuth clients for login vs Google Drive
- [ ] Enable Stripe webhook signing secret
- [ ] Use MongoDB Atlas with IP allowlist and TLS
- [ ] Do not commit `.env.local` or API keys
