# Codebase Structure

**Analysis Date:** 2026-05-15

## Directory Layout

```
ecommerce-api/
├── src/                        # All application source code
│   ├── main.ts                 # Bootstrap: app factory, global setup, Swagger
│   ├── app.module.ts           # Root NestJS module
│   ├── app.controller.ts       # Root controller (minimal)
│   ├── app.service.ts          # Root service (minimal)
│   ├── modules/                # Feature domains (one dir per bounded context)
│   │   ├── auth/               # Authentication & token management
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── docs/           # Swagger response decorators
│   │   │   ├── dto/            # Request/response DTOs
│   │   │   ├── interfaces/     # TypeScript interfaces (JwtPayload)
│   │   │   └── strategies/     # Passport strategies (jwt, refresh)
│   │   │       └── services/   # Sub-services (email-verification, refresh-token, token-blacklist)
│   │   ├── users/              # User CRUD
│   │   ├── categories/         # Category hierarchy
│   │   ├── products/           # Product catalogue
│   │   ├── cart/               # Shopping cart
│   │   ├── order/              # Order lifecycle + state machine util
│   │   └── payment/            # Payment recording & confirmation
│   ├── common/                 # Cross-cutting shared code
│   │   ├── common.module.ts    # Exports guards + PasswordService
│   │   ├── decorators/         # Custom param/method decorators
│   │   ├── dto/                # Shared DTOs (pagination, id-param)
│   │   ├── filters/            # Global exception filter
│   │   ├── guards/             # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/       # TransformResponseInterceptor
│   │   ├── middleware/         # CorrelationIdMiddleware
│   │   ├── services/           # PasswordService
│   │   └── utils/              # Helpers (slug, duration, token-hash, category-tree)
│   ├── config/                 # Environment validation + DB seeder
│   │   ├── env.validation.ts   # Joi schema for env vars
│   │   └── seed.ts             # Database seeder script
│   ├── database/               # (directory present, currently empty)
│   ├── health/                 # Liveness probe endpoint
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── prisma/                 # Prisma client wrapper
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── prisma/                     # Prisma ORM configuration
│   ├── schema.prisma           # Database schema (models, enums, relations)
│   └── migrations/             # SQL migration history
├── test/                       # E2E tests only
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── docker/                     # Docker support files
│   ├── postgres/               # Postgres Docker config
│   └── (docker-compose.yml at root)
├── docs/                       # Project documentation
│   ├── agents/                 # Agent skill references
│   ├── modules/                # Per-module docs
│   └── planning/               # Phase planning docs
├── .planning/                  # GSD codebase maps & phase plans
│   └── codebase/               # Auto-generated architecture docs
├── .github/workflows/          # CI/CD pipeline definitions
├── .husky/                     # Git hooks (pre-commit)
├── .agents/skills/             # Agent skill definitions
├── .claude/skills/             # Claude skill definitions
├── dist/                       # Compiled output (not committed)
├── node_modules/               # Dependencies (not committed)
├── nest-cli.json               # NestJS CLI configuration
├── tsconfig.json               # TypeScript config with path aliases
├── tsconfig.build.json         # Build-specific TS config
├── eslint.config.mjs           # ESLint flat config
├── package.json                # Dependencies and scripts
├── prisma.config.ts            # Prisma config override
├── render.yaml                 # Render.com deployment config
├── docker-compose.yml          # Local Docker services
├── commitlint.config.js        # Commit message linting
└── CLAUDE.md                   # Project-level agent instructions
```

## Directory Purposes

**`src/modules/`:**

- Purpose: All feature domain code, one subdirectory per bounded context
- Contains: Controller, Service, Module, DTOs, interfaces, sub-services per domain
- Key files: Each module dir contains `*.controller.ts`, `*.service.ts`, `*.module.ts`

**`src/common/`:**

- Purpose: Shared infrastructure — imported by feature modules, applied globally in `main.ts`
- Contains: Guards, decorators, interceptors, filters, middleware, shared DTOs, utility functions
- Key files: `src/common/guards/jwt-auth.guard.ts`, `src/common/guards/roles.guard.ts`, `src/common/interceptors/transform-response.interceptor.ts`, `src/common/filters/http-exception.filter.ts`, `src/common/middleware/correlation-id.middleware.ts`

**`src/prisma/`:**

- Purpose: NestJS-managed Prisma client singleton
- Contains: `PrismaService` (extends `PrismaClient`), `PrismaModule` (global)
- Key files: `src/prisma/prisma.service.ts`

**`src/config/`:**

- Purpose: Environment configuration and data seeding
- Contains: Joi env validation schema, seed script
- Key files: `src/config/env.validation.ts`, `src/config/seed.ts`

**`prisma/`:**

- Purpose: Database schema and migration history
- Contains: `schema.prisma` with all model definitions, `migrations/` with timestamped SQL
- Key files: `prisma/schema.prisma`

**`test/`:**

- Purpose: E2E tests only (unit tests are co-located in `src/`)
- Contains: `app.e2e-spec.ts`, `jest-e2e.json` config

## Key File Locations

**Entry Points:**

- `src/main.ts`: Application bootstrap, global pipes/filters/interceptors, Swagger setup
- `src/app.module.ts`: Root module imports, rate limiter, correlation ID middleware

**Configuration:**

- `src/config/env.validation.ts`: All required environment variables (Joi schema)
- `tsconfig.json`: Path aliases `@common/*`, `@modules/*`, `@config/*`
- `nest-cli.json`: NestJS source root and assets config

**Core Logic:**

- `src/modules/order/order-transitions.util.ts`: Order state machine (transition table)
- `src/common/interceptors/transform-response.interceptor.ts`: Response envelope logic
- `src/common/filters/http-exception.filter.ts`: Error response formatting
- `src/modules/auth/strategies/jwt.strategy.ts`: JWT validation including blacklist check

**Database:**

- `prisma/schema.prisma`: Source of truth for all database models
- `src/prisma/prisma.service.ts`: Single database client used by all services

**Testing:**

- `test/app.e2e-spec.ts`: E2E tests
- Unit/spec files: Co-located alongside source (`*.spec.ts` in `src/`)

## Naming Conventions

**Files:**

- Feature files: `kebab-case.type.ts` — e.g., `auth.service.ts`, `create-product.dto.ts`, `jwt-auth.guard.ts`
- Spec files: `kebab-case.type.spec.ts` — e.g., `order-transitions.util.spec.ts`
- Module files: `feature-name.module.ts`

**Directories:**

- Feature modules: plural noun, kebab-case — e.g., `products/`, `categories/`, `modules/auth/`
- Sub-feature groupings: type name — e.g., `dto/`, `interfaces/`, `strategies/`, `services/`, `docs/`

**Classes:**

- Services: `PascalCase` + `Service` suffix — e.g., `AuthService`, `CartService`
- Controllers: `PascalCase` + `Controller` — e.g., `ProductsController`
- Modules: `PascalCase` + `Module` — e.g., `AuthModule`
- Guards: `PascalCase` + `Guard` — e.g., `JwtAuthGuard`, `RolesGuard`
- DTOs: `PascalCase` + `Dto` — e.g., `CreateProductDto`, `AuthResponseDto`
- Interfaces: `PascalCase` + `Interface` suffix optional — e.g., `JwtPayload`

## TypeScript Path Aliases

Defined in `tsconfig.json`:

- `@common/*` → `src/common/*`
- `@modules/*` → `src/modules/*`
- `@config/*` → `src/config/*`

Use these aliases for imports across module boundaries instead of relative paths like `../../common/`.

## Where to Add New Code

**New Feature Module (e.g., Reviews):**

- Create directory: `src/modules/reviews/`
- Add files: `reviews.controller.ts`, `reviews.service.ts`, `reviews.module.ts`
- Add `dto/` subdirectory for request/response DTOs
- Import `PrismaModule` (global — no explicit import needed)
- Import `CommonModule` if guards or `PasswordService` are needed
- Register in `src/app.module.ts` imports array

**New Shared Guard:**

- Implementation: `src/common/guards/my-new.guard.ts`
- Export from: `src/common/common.module.ts` (add to `providers` and `exports`)

**New Shared Utility:**

- Implementation: `src/common/utils/my-util.util.ts`
- Add spec: `src/common/utils/my-util.util.spec.ts`
- Import directly (not via `CommonModule`) — utils are plain functions, not injectable

**New Shared Decorator:**

- Implementation: `src/common/decorators/my-decorator.decorator.ts`
- Import directly in controllers/handlers that need it

**New DTO (shared):**

- Implementation: `src/common/dto/my-shared.dto.ts`

**New Migration:**

- Run `npx prisma migrate dev --name description` from repo root
- Migration files auto-created in `prisma/migrations/`

**Tests:**

- Unit tests: Co-locate with source file — `src/modules/cart/cart.service.spec.ts`
- E2E tests: `test/` directory

## Special Directories

**`dist/`:**

- Purpose: Compiled JavaScript output from `tsc`
- Generated: Yes (by `npm run build`)
- Committed: No (in `.gitignore`)

**`prisma/migrations/`:**

- Purpose: Migration SQL history managed by Prisma
- Generated: Yes (by `prisma migrate dev`)
- Committed: Yes — migration history must be committed

**`.planning/codebase/`:**

- Purpose: GSD-generated architecture documentation for agent consumption
- Generated: Yes (by `/gsd:map-codebase`)
- Committed: Yes — used by `/gsd:plan-phase` and `/gsd:execute-phase`

**`graphify-out/`:**

- Purpose: Output cache from graphify knowledge-graph skill
- Generated: Yes
- Committed: Partial — cache files present in repo (`.gitignore` may not exclude)

**`.agents/skills/` and `.claude/skills/`:**

- Purpose: Agent skill definitions for Claude/GSD commands
- Generated: No (hand-authored)
- Committed: Yes

---

_Structure analysis: 2026-05-15_
