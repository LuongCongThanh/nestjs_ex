# Technology Stack

**Analysis Date:** 2026-05-15

## Languages

**Primary:**

- TypeScript 5.7.x - All application code in `src/`
- SQL - Database schema managed via Prisma migrations in `prisma/`

**Secondary:**

- JavaScript (ES2023) - Compiled output target in `dist/`

## Runtime

**Environment:**

- Node.js v24.11.1 (detected from running environment)
- Target: CommonJS modules, ES2023 output

**Package Manager:**

- npm 11.13.0
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**

- NestJS 11.x (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) - Main application framework, REST API
- Express (via `@nestjs/platform-express`) - Underlying HTTP server

**Auth:**

- `@nestjs/jwt` ^11.0.2 - JWT signing/verification
- `@nestjs/passport` ^11.0.5 - Auth middleware integration
- `passport` ^0.7.0 + `passport-jwt` ^4.0.1 - JWT strategy

**API Documentation:**

- `@nestjs/swagger` ^11.2.6 - OpenAPI/Swagger docs, served at `/api`

**ORM / Database:**

- Prisma ^6.19.2 (`@prisma/client` runtime + `prisma` CLI) - Type-safe ORM for PostgreSQL

**Validation:**

- `class-validator` ^0.14.1 - Decorator-based DTO validation
- `class-transformer` ^0.5.1 - Object transformation/serialization
- `joi` ^18.0.2 - Environment variable schema validation at startup (`src/config/env.validation.ts`)

**Security:**

- `helmet` ^8.1.0 - HTTP security headers middleware
- `@nestjs/throttler` ^6.5.0 - Rate limiting (60s TTL, 10 req default; 100 req in production)
- `bcryptjs` ^3.0.3 - Password hashing (12 bcrypt rounds, see `src/common/services/password.service.ts`)

**Testing:**

- `jest` ^29.7.0 - Test runner
- `ts-jest` ^29.4.6 - TypeScript transformer for Jest
- `supertest` ^7.2.2 - HTTP integration testing
- `@nestjs/testing` ^11.1.16 - NestJS test utilities

**Build/Dev:**

- `@nestjs/cli` ^11.0.0 - NestJS build tooling (`nest build`, `nest start`)
- `@swc/core` ^1.15.18 + `@swc/cli` ^0.6.0 - Fast TypeScript compilation (SWC)
- `ts-node` ^10.9.2 - TypeScript execution for scripts (seeder, etc.)
- `tsconfig-paths` ^4.2.0 - Path alias resolution at runtime

**Code Quality:**

- ESLint ^9.39.2 with `typescript-eslint` ^8.20.0 - Linting (`eslint.config.mjs`)
- Prettier ^3.7.4 - Code formatting
- Husky ^9.1.7 - Git hooks
- lint-staged ^17.0.4 - Pre-commit linting
- `@commitlint/cli` ^21.0.1 + `@commitlint/config-conventional` ^21.0.1 - Commit message linting (`commitlint.config.js`)

## Key Dependencies

**Critical:**

- `@prisma/client` ^6.19.2 - Database access layer; all DB queries go through `src/prisma/prisma.service.ts`
- `@nestjs/jwt` ^11.0.2 - Core to auth: access tokens (1d) and refresh tokens (7d)
- `bcryptjs` ^3.0.3 - Secure password storage; 12 rounds enforced in `PasswordService`
- `rxjs` ^7.8.2 - Required by NestJS core for reactive streams/interceptors
- `reflect-metadata` ^0.2.2 - Required by NestJS decorator metadata system

**Infrastructure:**

- `pg` ^8.20.0 - PostgreSQL driver (used by Prisma under the hood)
- `helmet` ^8.1.0 - Applied globally in `src/main.ts` before all routes

## Configuration

**Environment:**

- Configured via `.env` file (see `.env.example` for development, `.env.production.example` for production)
- Validated at startup with Joi schema in `src/config/env.validation.ts`
- Loaded globally by `@nestjs/config` `ConfigModule.forRoot({ isGlobal: true })` in `src/app.module.ts`

**Required env vars at startup:**

```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
JWT_SECRET (min 32 chars), JWT_EXPIRATION (format: 1d/7d/24h)
JWT_REFRESH_SECRET (min 32 chars), JWT_REFRESH_EXPIRATION
DATABASE_URL (for Prisma migrations)
```

**Optional env vars:**

```
PORT (default: 3000)
API_PREFIX (default: api/v1)
CORS_ORIGIN (default: http://localhost:3000)
THROTTLE_TTL (default: 60), THROTTLE_LIMIT (default: 100)
MAX_FILE_SIZE (default: 5MB), UPLOAD_DEST (default: ./uploads)
DEFAULT_PAGE_SIZE (default: 10), MAX_PAGE_SIZE (default: 100)
```

**Build:**

- `tsconfig.json` - TypeScript config (CommonJS, ES2023 target, strict null checks, decorator metadata enabled)
- `tsconfig.build.json` - Build config (excludes test files)
- `nest-cli.json` - NestJS CLI config (`sourceRoot: src`, `deleteOutDir: true`)
- `eslint.config.mjs` - Flat ESLint config with TypeScript and Prettier integration

**Path Aliases (TypeScript):**

- `@config/*` → `src/config/*`
- `@modules/*` → `src/modules/*`
- `@common/*` → `src/common/*`

## Platform Requirements

**Development:**

- Node.js 24.x (current environment)
- PostgreSQL 16 (via Docker: `docker-compose.yml` runs `postgres:16-alpine` on port 5432)
- Docker optional: `docker-compose up` starts postgres + pgAdmin (port 5050)

**Production:**

- Render.com (free tier) - configured in `render.yaml`
- Neon (serverless PostgreSQL) - `DATABASE_URL` with `sslmode=require`
- Build: `npm install && npx prisma generate && npm run build`
- Start: `npx prisma migrate deploy && node dist/src/main`
- Health check endpoint: `/health`

---

_Stack analysis: 2026-05-15_
