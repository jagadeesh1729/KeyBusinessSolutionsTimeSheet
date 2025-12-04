# KeyBusinessSolutionsTimeSheet

Production-ready setup for the KeyBusinessSolutionsTimeSheet application.

## Project Structure

- `frontend/` – Vite + React + TypeScript UI
- `backend/` – Express + TypeScript API
- `docker-compose.yaml` – Orchestration for MySQL, backend, and frontend
- `.env.example` – Sample environment configuration for local/dev/prod

## Environment Variables

Create a `.env` file based on `.env.example` and adjust for your environment.

| Variable | Description |
| --- | --- |
| NODE_ENV | Runtime environment (`development`/`production`). |
| PORT | Backend port. |
| TRUST_PROXY | Enable proxy headers when running behind reverse proxies. |
| LOG_LEVEL | Logger level (`debug`, `info`, etc.). |
| DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME | MySQL connection settings. |
| DB_CONNECT_MAX_RETRIES / DB_CONNECT_RETRY_DELAY_MS | Database connection retry configuration. |
| JWT_SECRET | Secret for signing JWTs. |
| CORS_ORIGINS | Comma-separated list of allowed origins. |
| RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX | Global rate limiting window and max requests. |
| LOGIN_RATE_LIMIT_WINDOW_MS / LOGIN_RATE_LIMIT_MAX | Rate limiting for login endpoints. |
| RATE_LIMIT_MAX_KEYS | Maximum unique client entries tracked by the in-memory rate limiter. |
| CLIENT_ID / CLIENT_SECRET / REDIRECT_URI | Google OAuth credentials. |
| IONOS_HOST / IONOS_PORT / IONOS_USER / IONOS_PASS / IONOS_FROM | Email transport configuration. |
| ADMIN_EMAIL | Admin notification address. |
| VITE_API_BASE_URL | Frontend API base URL (defaults to `/api`). |
| VITE_BACKEND_URL | Backend URL for Vite dev proxy. |
| VITE_LOGIN_BACKGROUND_URL | Background image used on the login screen. |

## Local Development

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
3. Start backend (development): `cd backend && npm run dev`
4. Start frontend (development): `cd frontend && npm run dev`

## Docker (Production-style)

Build and run the full stack with Docker Compose:

```bash
docker compose --env-file .env up --build
```

- Backend available on `${PORT:-3000}`
- Frontend available on `http://localhost:8080`
- MySQL exposed on `3306`

## Docker Images

- **Frontend**: Multi-stage build producing a static bundle served by Nginx.
- **Backend**: Multi-stage Node.js image running compiled TypeScript output.

## Health Checks

- Backend: `GET /health`
- MySQL: container-level `mysqladmin ping`

## Notes

- Never commit real secrets. Use the provided `.env.example` as a template.
- Adjust `CORS_ORIGINS` and rate limits to match your deployment needs.
- `docker-compose.yaml` references `${VARIABLE}` placeholders only; populate a private `.env` on EC2 (or pass `--env-file`) before running so no secrets are baked into images or committed.
