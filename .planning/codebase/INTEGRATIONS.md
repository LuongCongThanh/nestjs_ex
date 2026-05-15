# External Integrations

**Analysis Date:** 2026-05-15

## APIs & External Services

**No external third-party APIs are currently integrated.** The application is self-contained. Notable stubs:

- **Email sending** - The auth flow generates verification tokens and password reset tokens but only simulates email delivery via `Logger.log()`. See `src/modules/auth/auth.service.ts` line 72:

  ```typescript
  this.logger.log(`[EMAIL SIMULATION] To: ${savedUser.email}, Link: ${verificationLink}`);
  ```

  No SMTP provider, SendGrid, Mailgun, SES, or Nodemailer is wired in. This is a known gap.

- **Payment processing** - `src/modules/payment/payment.service.ts` manages payment records in the database but has no integration with Stripe, PayPal, VNPay, or any payment gateway. Payment confirmation is manual (admin/staff action only).

## Data Storage

**Databases:**

- **PostgreSQL 16**
  - Development: Docker container defined in `docker-compose.yml` (`postgres:16-alpine`, port 5432, db `ecommerce_db`)
  - Production: Neon serverless PostgreSQL
  - Connection (Prisma): `DATABASE_URL` env var (e.g., `postgresql://user:pass@host/db?sslmode=require`)
  - Connection (NestJS app): Individual vars `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
  - Client/ORM: Prisma 6.x — `PrismaClient` wrapped in `src/prisma/prisma.service.ts` (`PrismaService extends PrismaClient`)
  - Schema: `prisma/schema.prisma` — 12 models (User, Product, Category, Order, OrderItem, Payment, Cart, CartItem, Address, RefreshToken, EmailVerificationToken, ResetToken, TokenBlacklist)

**File Storage:**

- Local filesystem only (env var `UPLOAD_DEST`, default `./uploads`)
- No cloud storage (S3, Cloudinary, GCS) is configured

**Caching:**

- None detected — no Redis, Memcached, or in-memory cache layer

## Authentication & Identity

**Auth Provider:**

- Custom (self-hosted JWT-based auth, no OAuth provider)
  - Implementation: `src/modules/auth/` — full auth module
  - Access token: JWT signed with `JWT_SECRET`, expiry `JWT_EXPIRATION` (default 1d)
  - Refresh token: JWT signed with `JWT_REFRESH_SECRET`, expiry `JWT_REFRESH_EXPIRATION` (default 7d); stored hashed in `refresh_tokens` table
  - Token blacklist: `token_blacklist` table — checked on every protected request in `src/modules/auth/strategies/jwt.strategy.ts`
  - Password hashing: bcryptjs, 12 rounds, in `src/common/services/password.service.ts`
  - Email verification: Token stored hashed in `email_verification_tokens` table; sent via log simulation (no real email)
  - Password reset: Token stored in `reset_tokens` table; delivery also simulated
  - Strategies: `JwtStrategy` (access token from Bearer header) and `RefreshStrategy` (refresh token), both in `src/modules/auth/strategies/`
  - Guards: `JwtAuthGuard` (`src/common/guards/jwt-auth.guard.ts`), `RolesGuard` (`src/common/guards/roles.guard.ts`)
  - Roles: `user`, `admin`, `staff` (defined in Prisma schema `UserRole` enum)

## Monitoring & Observability

**Error Tracking:**

- None — no Sentry, Datadog, New Relic, or equivalent

**Logs:**

- NestJS built-in `Logger` used throughout (console output)
- Correlation ID middleware at `src/common/middleware/correlation-id.middleware.ts` — adds `x-correlation-id` header to all requests for request tracing

**Health Check:**

- Custom endpoint at `GET /health` (`src/health/health.controller.ts`)
- Runs `SELECT 1` via Prisma to confirm DB connectivity
- Returns: `{ status, timestamp, database, uptime, environment }`
- Used by Render.com `healthCheckPath: /health`

## CI/CD & Deployment

**Hosting:**

- Render.com (free tier) — config in `render.yaml`
- Runtime: Node.js
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npx prisma migrate deploy && node dist/src/main`

**Database (Production):**

- Neon serverless PostgreSQL — connection via `DATABASE_URL` env var with SSL

**CI Pipeline:**

- None configured — no GitHub Actions, CircleCI, or similar workflows detected

**Docker (Development):**

- `docker-compose.yml` provides:
  - `postgres:16-alpine` — main database (port 5432)
  - `dpage/pgadmin4:8.14` — DB admin GUI (port 5050, `tools` profile, opt-in only)

## Environment Configuration

**Required env vars:**

```
# Database (Prisma)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Database (NestJS app)
DB_HOST=
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

# JWT
JWT_SECRET=<min 32 chars>
JWT_EXPIRATION=1d
JWT_REFRESH_SECRET=<min 32 chars, different from JWT_SECRET>
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://your-frontend.com

# App
PORT=3000
NODE_ENV=production
```

**Optional env vars (with defaults):**

```
THROTTLE_TTL=60
THROTTLE_LIMIT=100
MAX_FILE_SIZE=5242880
UPLOAD_DEST=./uploads
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
API_PREFIX=api/v1
```

**Secrets location:**

- `.env` (local dev, gitignored)
- Render.com dashboard env vars (production, `sync: false` for secrets, `generateValue: true` for JWT secrets)
- `.env.example` and `.env.production.example` committed as templates (no real values)

## Webhooks & Callbacks

**Incoming:**

- None — no webhook endpoints registered

**Outgoing:**

- None — no outgoing webhooks configured

---

_Integration audit: 2026-05-15_
