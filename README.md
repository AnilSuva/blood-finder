# BloodFinder

BloodFinder is a passwordless emergency blood-request app. Requests are visible only to available donors in the same city whose blood type is compatible with the patient's type. Phone numbers are never present in feed responses and are revealed only after a server-side eligibility check.

## Run locally

1. Start MongoDB: `docker compose up -d`.
2. Copy `backend/.env.example` to `backend/.env`, generate four 32-byte-plus secrets, and configure SMTP/Turnstile as appropriate.
3. Copy `frontend/.env.example` to `frontend/.env.local`.
4. In separate terminals run `npm install` then `npm run dev` in `backend` and `frontend`.
5. Seed cities with `cd backend; npm run seed`.

The API starts on port 4000 and the web app starts on port 3000. In development, set `TURNSTILE_SECRET_KEY` to a valid secret or use Cloudflare's documented test key.

## Checks

Run `npm run lint`, `npm run typecheck`, and `npm test` in each application. Run `npm audit` before release. The backend test suite covers blood compatibility, OTP primitives, and feed filtering; integration tests can use a dedicated MongoDB selected by `MONGODB_URI`.

To run the end-to-end OTP integration test, point `MONGODB_URI` at a disposable database and run `RUN_INTEGRATION=1 npm test` (PowerShell: `$env:RUN_INTEGRATION='1'; npm.cmd test`).

## Deployment notes

Use TLS at the edge, set `NODE_ENV=production`, use a real cookie domain, restrict `CORS_ORIGINS` to deployed frontend origins, and supply SMTP/Turnstile/Google credentials. MongoDB must be managed with backups, restricted network access, and encryption at rest. Run the city seed once during initial deployment.

See [SECURITY.md](SECURITY.md) for the threat model and reporting guidance.
