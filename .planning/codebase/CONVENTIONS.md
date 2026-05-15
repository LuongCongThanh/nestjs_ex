# Coding Conventions

**Analysis Date:** 2026-05-15

## Naming Patterns

**Files:**

- Source files: `kebab-case.ts` (e.g., `auth.service.ts`, `token-hash.util.ts`)
- Test files: `kebab-case.spec.ts` co-located with source (e.g., `slug.util.spec.ts`)
- E2E tests: `kebab-case.e2e-spec.ts` in `test/`
- DTOs: `<action>-<resource>.dto.ts` (e.g., `create-product.dto.ts`, `find-users-query.dto.ts`)
- Decorators: `<name>.decorator.ts` (e.g., `roles.decorator.ts`, `public.decorator.ts`)
- Guards: `<name>.guard.ts` (e.g., `jwt-auth.guard.ts`, `roles.guard.ts`)
- Filters: `<name>.filter.ts` (e.g., `http-exception.filter.ts`)
- Interceptors: `<name>.interceptor.ts` (e.g., `transform-response.interceptor.ts`)
- Middleware: `<name>.middleware.ts` (e.g., `correlation-id.middleware.ts`)
- Strategies: `<name>.strategy.ts` (e.g., `jwt.strategy.ts`, `refresh.strategy.ts`)
- Interfaces: `<name>.interface.ts` (e.g., `jwt-payload.interface.ts`)
- Utilities: `<name>.util.ts` (e.g., `slug.util.ts`, `duration.util.ts`)

**Classes:**

- PascalCase for all classes: `AuthService`, `CreateProductDto`, `JwtAuthGuard`
- NestJS class suffixes strictly observed: `Controller`, `Service`, `Module`, `Guard`, `Filter`, `Interceptor`, `Middleware`, `Decorator`, `Strategy`, `Pipe`

**Functions and Methods:**

- camelCase: `generateSlug`, `hashToken`, `parseDurationMs`, `canTransition`
- Async methods return `Promise<T>` explicitly typed where the return matters
- Private helpers prefixed with nothing special, but documented and grouped at the end of class

**Variables:**

- camelCase: `normalizedEmail`, `hashedPassword`, `refreshToken`
- `snake_case` only for token field names that match API convention: `access_token`, `refresh_token`

**Constants / Metadata Keys:**

- SCREAMING_SNAKE_CASE: `ROLES_KEY`, `IS_PUBLIC_KEY`, `RESPONSE_MESSAGE`

**Interfaces:**

- PascalCase, no `I` prefix: `JwtPayload`, `RequestWithCorrelationId`, `PaginatedResult<T>`

**Types (Prisma enums):**

- Imported directly from `@prisma/client`, used as-is: `UserRole`, `OrderStatus`

## Code Style

**Formatter:** Prettier

**Key settings** (`.prettierrc`):

- `"semi": true` — always use semicolons
- `"singleQuote": true` — single quotes for strings
- `"trailingComma": "all"` — trailing commas everywhere (ES5+)
- `"printWidth": 120` — max line width 120 chars
- `"tabWidth": 2` — 2-space indentation

**Linter:** ESLint 9 with TypeScript-ESLint (`eslint.config.mjs`)

**Key rules:**

- `@typescript-eslint/no-explicit-any`: `off` — `any` is allowed
- `@typescript-eslint/no-floating-promises`: `warn` — floating promises should be awaited
- `@typescript-eslint/no-unsafe-argument`: `warn`
- TypeScript type-checked rules (`recommendedTypeChecked`) enabled
- `prettier` integrated as ESLint rule (conflicts cause ESLint errors)

**TypeScript:**

- Strict mode implied via `typescript-eslint` type checking
- Path aliases defined in `jest` config (also in `tsconfig-paths`):
  - `@common/*` → `src/common/*`
  - `@modules/*` → `src/modules/*`
  - `@config/*` → `src/config/*`

## Import Organization

**Order observed across files:**

1. External NestJS packages (`@nestjs/common`, `@nestjs/core`, etc.)
2. Third-party packages (`@prisma/client`, `rxjs`, `express`, etc.)
3. Path-aliased internal imports (`@common/...`, `@modules/...`, `@config/...`)
4. Relative imports (same module, `./` or `../`)

**Path Aliases:**

- `@common/` — shared cross-cutting code: guards, decorators, filters, utils, services
- `@modules/` — feature modules (auth, users, products, etc.)
- `@config/` — configuration and env validation

**Note:** `PrismaService` is imported with a relative path (`../../prisma/prisma.service`) in service files, not via an alias — inconsistency exists.

## Error Handling

**Patterns:**

- Throw NestJS built-in HTTP exceptions directly in services: `NotFoundException`, `ConflictException`, `UnauthorizedException`, `BadRequestException`
- Message strings are human-readable and descriptive: `'Category with ID ${categoryId} not found'`
- Prisma constraint errors caught by code: `Prisma.PrismaClientKnownRequestError` with `error.code === 'P2002'` for unique constraint violations
- Unknown errors rethrown: `throw error` — no swallowing
- JWT verification wrapped in `try/catch`, rethrows as `UnauthorizedException`
- `forgotPassword` silently returns for non-existent emails (security: avoids user enumeration), logs a `warn` instead
- Global `HttpExceptionFilter` (`src/common/filters/http-exception.filter.ts`) formats all HTTP errors with `statusCode`, `timestamp`, `path`, `method`, `correlationId`, `message`, optional `errors` array

**Response envelope (success):**

- All successful responses wrapped by `TransformResponseInterceptor` (`src/common/interceptors/transform-response.interceptor.ts`):
  ```json
  { "statusCode": 200, "success": true, "message": "...", "data": { ... } }
  ```
- If service returns an object already containing `success` + `message`, the interceptor passes it through as-is (avoids double-wrapping)

## Logging

**Framework:** NestJS built-in `Logger`

**Patterns:**

- Each class that needs logging creates `private readonly logger = new Logger(ClassName.name)`
- `logger.log(...)` — informational, used for simulated email outputs and auth events
- `logger.warn(...)` — non-critical anomalies (e.g., password reset for unknown email)
- `logger.error(...)` — HTTP errors logged in `HttpExceptionFilter` with stack trace
- No third-party logging library (e.g., Winston, Pino) — plain NestJS Logger only

## Comments

**When to Comment:**

- JSDoc blocks on public methods in services when the function purpose is non-obvious
- Some comments in Vietnamese (developer language) appear in `is-strong-password.decorator.ts` and `users.service.ts` — mixed-language commenting exists
- Inline comments used for intent: `// Email Simulation...`, `// Exclude password`, `// Update last login timestamp`
- Swagger `@ApiOperation` decorators act as living documentation for all controller methods

**JSDoc/TSDoc:**

- Used selectively on service methods with `/** ... */` format
- Not required for every function — applied where business logic needs clarification

## Function Design

**Size:** Methods kept focused; large services split into sub-services (e.g., `AuthService` delegates to `EmailVerificationService`, `RefreshTokenService`, `TokenBlacklistService`)

**Parameters:** DTOs used for all input validation at controller boundary; services receive typed DTOs

**Return Values:**

- Services return typed values or throw exceptions — no `null` returns for not-found (use `NotFoundException` instead)
- `validateUser` is an exception: returns `null` when user inactive (used internally by JWT strategy)
- Controller methods always `return` the service call result directly — no manual response shaping in controllers

## Module Design

**Exports:**

- Each feature module explicitly exports its service if needed by other modules
- `CommonModule` (`src/common/common.module.ts`) aggregates shared providers

**Barrel Files:**

- Not used — imports go directly to the file path

## DTO Conventions

**Validation:**

- Every DTO field validated with `class-validator` decorators
- Optional fields decorated with `@IsOptional()` first, then type/constraint validators
- Nested objects use `@ValidateNested()` + `@Type(() => NestedClass)`
- Every DTO field has `@ApiProperty` or `@ApiPropertyOptional` for Swagger documentation

**Swagger Docs pattern for controllers:**

- Swagger response schemas isolated in `docs/<module>.responses.ts` files (e.g., `src/modules/auth/docs/auth.responses.ts`)
- Reusable `@ApiResponse` factories exported as constants and applied as decorators

## Commit Conventions

**Format:** Conventional Commits enforced via `commitlint`

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `revert`

**Rules:**

- No sentence-case, start-case, pascal-case, or upper-case subjects
- Max header length: 100 characters

**Pre-commit hooks** (`.husky/pre-commit`):

1. `npx lint-staged` — lint and format staged files
2. `npm run typecheck` — TypeScript compile check
3. `npm run test` — full unit test suite must pass

## Global NestJS Setup (`src/main.ts`)

- `ValidationPipe` global with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- `HttpExceptionFilter` global
- `TransformResponseInterceptor` global
- `ClassSerializerInterceptor` global (enables `@Exclude()` on DTOs)
- Helmet security headers applied
- CORS enabled via `CORS_ORIGIN` env var

---

_Convention analysis: 2026-05-15_
