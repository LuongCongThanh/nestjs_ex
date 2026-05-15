<!-- refreshed: 2026-05-15 -->

# Architecture

**Analysis Date:** 2026-05-15

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HTTP Clients / Consumers                            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                    ┌────────────▼───────────┐
                    │   main.ts (Bootstrap)   │
                    │  Helmet, CORS, Swagger  │
                    │  Global Pipes/Filters/  │
                    │    Interceptors         │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│                         AppModule  `src/app.module.ts`                       │
│  CorrelationIdMiddleware  •  ThrottlerModule  •  ConfigModule               │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│  auth    │  users   │categories│ products │  cart    │  order   │ payment  │
│ Module   │ Module   │ Module   │ Module   │ Module   │ Module   │ Module   │
│`modules/ │`modules/ │`modules/ │`modules/ │`modules/ │`modules/ │`modules/ │
│ auth`    │ users`   │categories│products` │  cart`   │  order`  │ payment` │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘
     │          │          │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │  CommonModule  `src/common/`        │
                    │  Guards • Decorators • Interceptors │
                    │  Filters • Services • Utils         │
                    └─────────────────┬─────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │  PrismaModule  `src/prisma/`        │
                    │  PrismaService (singleton client)   │
                    └─────────────────┬─────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │  PostgreSQL (Neon / local Docker)   │
                    │  `prisma/schema.prisma`             │
                    └───────────────────────────────────┘
```

## Component Responsibilities

| Component        | Responsibility                                    | File                                          |
| ---------------- | ------------------------------------------------- | --------------------------------------------- |
| Bootstrap        | App initialization, global middleware, Swagger    | `src/main.ts`                                 |
| AppModule        | Root module wiring, rate limiting, correlation ID | `src/app.module.ts`                           |
| AuthModule       | Registration, login, JWT issuance, token rotation | `src/modules/auth/auth.module.ts`             |
| UsersModule      | User CRUD, soft-delete, profile management        | `src/modules/users/users.module.ts`           |
| CategoriesModule | Hierarchical category tree with cycle prevention  | `src/modules/categories/categories.module.ts` |
| ProductsModule   | Product CRUD, soft-delete, pagination/filtering   | `src/modules/products/products.module.ts`     |
| CartModule       | Per-user cart with lazy creation, item management | `src/modules/cart/cart.module.ts`             |
| OrderModule      | Order lifecycle with state machine enforcement    | `src/modules/order/order.module.ts`           |
| PaymentModule    | Payment creation and confirmation with order sync | `src/modules/payment/payment.module.ts`       |
| CommonModule     | Shared guards, decorators, password service       | `src/common/common.module.ts`                 |
| PrismaModule     | Database client lifecycle (connect/disconnect)    | `src/prisma/prisma.module.ts`                 |
| HealthModule     | Liveness probe with DB connectivity check         | `src/health/health.module.ts`                 |

## Pattern Overview

**Overall:** NestJS feature-module monolith with layered Controller → Service → PrismaService architecture.

**Key Characteristics:**

- Each domain is a self-contained NestJS module under `src/modules/`
- All database access goes through `PrismaService` — no repository abstraction layer
- `CommonModule` provides cross-cutting infrastructure (guards, password hashing)
- Global pipeline applied in `main.ts`: validation, exception filter, response transform, serialization
- Rate limiting applied globally via `ThrottlerModule`, also enforced at controller level with `@UseGuards(ThrottlerGuard)`

## Layers

**HTTP Layer (Controllers):**

- Purpose: Route mapping, input extraction, guard application, DTO transformation
- Location: `src/modules/*/` (`*.controller.ts`)
- Contains: `@Controller`, `@Get`, `@Post`, route guards (`JwtAuthGuard`, `RolesGuard`)
- Depends on: Service layer
- Used by: HTTP clients

**Business Logic Layer (Services):**

- Purpose: Business rules, orchestration, error throwing, data shaping
- Location: `src/modules/*/` (`*.service.ts`)
- Contains: `@Injectable` services, cross-module calls (e.g., `OrderService` calls `CartService`)
- Depends on: PrismaService, other services in same or imported modules
- Used by: Controllers

**Data Access Layer (Prisma):**

- Purpose: Single source of database communication
- Location: `src/prisma/prisma.service.ts`
- Contains: `PrismaService extends PrismaClient`
- Depends on: PostgreSQL (via `DATABASE_URL`)
- Used by: All feature services

**Cross-Cutting Layer (Common):**

- Purpose: Shared infrastructure used across all modules
- Location: `src/common/`
- Contains: Guards, decorators, interceptors, filters, middleware, utils, DTO base classes
- Depends on: NestJS core, Passport, Prisma types
- Used by: All feature modules, `main.ts`

## Data Flow

### Authenticated API Request (e.g., Add to Cart)

1. Request arrives → `CorrelationIdMiddleware` attaches `X-Correlation-ID` (`src/common/middleware/correlation-id.middleware.ts`)
2. `ThrottlerGuard` checks rate limit (10 req/60s per IP)
3. `JwtAuthGuard` → `JwtStrategy.validate()` checks token blacklist, then `AuthService.validateUser()` (`src/modules/auth/strategies/jwt.strategy.ts`)
4. `CartController.addItem()` receives validated DTO (`src/modules/cart/cart.controller.ts`)
5. `CartService.addItem()` calls `getOrCreateCart()` then upserts `CartItem` via `PrismaService` (`src/modules/cart/cart.service.ts`)
6. `TransformResponseInterceptor` wraps result in `{ statusCode, success, message, data }` (`src/common/interceptors/transform-response.interceptor.ts`)
7. `ClassSerializerInterceptor` strips `@Exclude()` fields
8. Response sent to client

### Order Creation Flow

1. `POST /api/v1/orders` → `OrderController.createOrder()`
2. `OrderService.createOrder()` reads cart from `PrismaService` (`src/modules/order/order.service.ts`)
3. `prisma.$transaction()`: creates `Order` + `OrderItem` records, clears cart items atomically
4. Order returns with `status: pending`

### Order Status Transition

1. `PATCH /api/v1/orders/:id/status` → role check via `RolesGuard`
2. `OrderService.updateStatus()` calls `canTransition(from, to, actor)` (`src/modules/order/order-transitions.util.ts`)
3. Transition map enforces lifecycle: `pending → confirmed (system) → processing → shipped → delivered`
4. Payment confirmation in `PaymentService.confirmPayment()` triggers `confirmed` status via `canTransition()` with `'system'` actor

**State Management:**

- No in-memory state — all state lives in PostgreSQL
- JWT blacklist and refresh tokens stored in DB (`TokenBlacklist`, `RefreshToken` tables)
- Cart is lazily created on first use (`CartService.getOrCreateCart()`)

## Key Abstractions

**Order State Machine:**

- Purpose: Enforces valid order lifecycle transitions per actor role
- Location: `src/modules/order/order-transitions.util.ts`
- Pattern: Lookup table (`TRANSITION_MAP`) keyed by `OrderStatus`, values contain allowed `to` states and permitted `actors`

**TransformResponseInterceptor:**

- Purpose: Uniform API response envelope `{ statusCode, success, message, data }`
- Location: `src/common/interceptors/transform-response.interceptor.ts`
- Pattern: Skips wrapping if response already has `{ success, message }` shape (prevents double-wrapping)

**PasswordService:**

- Purpose: bcrypt hash/compare abstraction
- Location: `src/common/services/password.service.ts`
- Pattern: Injectable service shared via `CommonModule`

**PrismaService:**

- Purpose: Singleton Prisma client with NestJS lifecycle hooks
- Location: `src/prisma/prisma.service.ts`
- Pattern: Extends `PrismaClient`, calls `$connect()` on init and `$disconnect()` on destroy

**CorrelationIdMiddleware:**

- Purpose: Traces requests end-to-end via `X-Correlation-ID` header
- Location: `src/common/middleware/correlation-id.middleware.ts`
- Pattern: Reads existing header or generates UUID; propagated in error responses

## Entry Points

**HTTP Server:**

- Location: `src/main.ts`
- Triggers: `node dist/main.js` / `npm run start:dev`
- Responsibilities: Create NestJS app, apply global middleware, configure Swagger at `/api`, listen on `PORT`

**Health Check:**

- Location: `src/health/health.controller.ts`
- Route: `GET /health` (excluded from global API prefix)
- Responsibilities: DB connectivity probe, uptime, environment

**Database Seeder:**

- Location: `src/config/seed.ts`
- Triggers: Manual execution (`ts-node src/config/seed.ts`)

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop. No worker threads. All I/O is async/await via Prisma.
- **Global state:** `PrismaService` is a module-scoped singleton shared across all feature modules. No other module-level shared mutable state detected.
- **Circular imports:** `AuthModule` imports `UsersModule`; `UsersModule` imports `CommonModule`; `AuthModule` also imports `CommonModule` — no circular dependency (unidirectional).
- **Token blacklist:** DB-backed (no Redis). Every authenticated request triggers a `TokenBlacklist` DB lookup — potential bottleneck at scale.
- **Email sending:** Simulated via `Logger.log()`. No real email transport exists. `EmailVerificationService` and password reset both use log-only simulation.

## Anti-Patterns

### DB-backed token blacklist on every request

**What happens:** `JwtStrategy.validate()` calls `tokenBlacklistService.isBlacklisted(token)` which issues a `SELECT` on `token_blacklist` for every authenticated request.
**Why it's wrong:** This adds a DB round-trip to every secured endpoint, increasing latency and DB load linearly with traffic.
**Do this instead:** Use Redis for O(1) blacklist lookups, or use short-lived tokens (default 15m) without blacklisting and rely on refresh token revocation. Reference: `src/modules/auth/strategies/jwt.strategy.ts:33`, `src/modules/auth/services/token-blacklist.service.ts`.

### Email simulation via Logger

**What happens:** Registration verification emails and password reset links are logged with `this.logger.log(...)` instead of being sent.
**Why it's wrong:** No real email delivery exists. Users cannot verify emails in non-development environments.
**Do this instead:** Integrate a mail transport (Nodemailer, SendGrid, Resend) behind an injectable `MailService`. Reference: `src/modules/auth/auth.service.ts:72`, `src/modules/auth/auth.service.ts:217`.

### No repository layer

**What happens:** All services call `this.prisma.*` directly with inline `where`/`select`/`include` objects scattered throughout.
**Why it's wrong:** Query logic is duplicated (e.g., `getProductSelect()` private method on `ProductsService`). Changing a query shape requires finding all call sites.
**Do this instead:** Introduce a thin repository layer or reusable query helpers per domain if query logic grows. Current scope is acceptable for small team. Reference: `src/modules/products/products.service.ts:162`.

## Error Handling

**Strategy:** NestJS `HttpException` subclasses thrown from services; caught globally by `HttpExceptionFilter`.

**Patterns:**

- Services throw typed exceptions: `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`
- `HttpExceptionFilter` formats all errors as `{ statusCode, timestamp, path, method, correlationId, message, errors? }` (`src/common/filters/http-exception.filter.ts`)
- Prisma `P2002` (unique constraint) caught at service level and re-thrown as `ConflictException`
- Unhandled bootstrap errors caught in `main.ts` with `process.exit(1)`

## Cross-Cutting Concerns

**Logging:** NestJS built-in `Logger` with class-name context. Used in services for audit trails (login events, email simulation). Error filter logs all non-404-favicon HTTP errors.
**Validation:** Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. DTOs use `class-validator` decorators.
**Authentication:** Passport JWT strategy (`passport-jwt`). Access tokens (15m default) + refresh tokens (7d default) with rotation. Token blacklist for logout. `@Public()` decorator skips `JwtAuthGuard`.
**Authorization:** `@Roles(UserRole.admin)` decorator + `RolesGuard`. Three roles: `user`, `staff`, `admin`.
**Response Shape:** `TransformResponseInterceptor` wraps all success responses. `ClassSerializerInterceptor` strips `@Exclude()` fields.

---

_Architecture analysis: 2026-05-15_
