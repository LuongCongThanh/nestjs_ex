# Codebase Concerns

**Analysis Date:** 2026-05-15

---

## Tech Debt

**Email is only simulated — no real email transport:**

- Issue: All email sending is logged to console using `[EMAIL SIMULATION]` messages. There is no actual email service, SMTP client, or provider SDK.
- Files: `src/modules/auth/auth.service.ts` (lines 69-72, 217), `src/modules/auth/services/email-verification.service.ts`
- Impact: Verification emails, password-reset links, and OTP re-send flows are completely non-functional in production. Users cannot register usable accounts on a real deployment.
- Fix approach: Introduce an `EmailService` (e.g., using Nodemailer + SMTP, SendGrid, or Resend). Add `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` env vars to `src/config/env.validation.ts`. Replace all `this.logger.log('[EMAIL SIMULATION]...')` calls with `await emailService.send(...)`.

**`FRONTEND_URL` env var is not validated at startup:**

- Issue: `src/modules/auth/auth.service.ts` reads `FRONTEND_URL` with an inline fallback `|| 'http://localhost:3000'`, but the var is absent from `src/config/env.validation.ts`.
- Files: `src/modules/auth/auth.service.ts` (line 69), `src/config/env.validation.ts`
- Impact: Verification links silently point to `localhost` in production, making email verification permanently broken without an obvious startup error.
- Fix approach: Add `FRONTEND_URL: Joi.string().uri().required()` to `src/config/env.validation.ts` and remove the inline fallback.

**Password-reset link uses a hardcoded `https://example.com` URL:**

- Issue: `forgotPassword()` in `src/modules/auth/auth.service.ts` line 217 hardcodes `https://example.com/reset-password` instead of using `FRONTEND_URL`.
- Files: `src/modules/auth/auth.service.ts` (line 217)
- Impact: Even when email delivery is eventually wired up, reset links will point to the wrong domain.
- Fix approach: Replace the hardcoded URL with `${this.configService.get('FRONTEND_URL')}/reset-password?token=...`.

**`TokenBlacklistService.revokeUserTokens()` is a stub:**

- Issue: The method body is empty — it accepts parameters but does nothing. The `eslint-disable-next-line` comment confirms this is intentional but deferred.
- Files: `src/modules/auth/services/token-blacklist.service.ts` (lines 51-54)
- Impact: `logoutAll` correctly revokes all refresh tokens but only blacklists the _current_ access token. Other in-flight access tokens for the same user remain valid until natural JWT expiry.
- Fix approach: Implement the method by inserting one `TokenBlacklist` row per active refresh token's corresponding access token, or document a scope limitation and remove the dead method signature.

**Duplicate query DTOs instead of extending `PaginationDto`:**

- Issue: `FindProductsQueryDto` and `FindUsersQueryDto` each independently duplicate page/limit fields with `@Min(1)` / `@Max(100)` rather than extending the shared `PaginationDto` from `src/common/dto/pagination.dto.ts`.
- Files: `src/modules/products/dto/find-products-query.dto.ts`, `src/modules/users/dto/find-users-query.dto.ts`, `src/common/dto/pagination.dto.ts`
- Impact: Drift risk — if max page size changes, it must be updated in three places. Future query DTOs are likely to copy this pattern further.
- Fix approach: Have `FindProductsQueryDto` and `FindUsersQueryDto` extend `PaginationDto`.

**DB env vars are validated but never consumed by the application:**

- Issue: `src/config/env.validation.ts` requires `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` at startup, but `src/prisma/prisma.service.ts` uses `PrismaClient` directly — which reads only `DATABASE_URL` from the Prisma schema (`prisma/schema.prisma`). The individual vars are never assembled into a connection string anywhere.
- Files: `src/config/env.validation.ts` (lines 10-14), `src/prisma/prisma.service.ts`, `prisma/schema.prisma`
- Impact: Deployment will fail validation if `DATABASE_URL` is provided but `DB_HOST` etc. are not, even though the application only needs `DATABASE_URL`. This is exactly reflected in `render.yaml` which must supply both sets. Confusing and error-prone.
- Fix approach: Either remove the individual `DB_*` vars from `env.validation.ts` (keep only `DATABASE_URL`), or dynamically assemble `DATABASE_URL` from them in a config factory and document the pattern.

**`as any` / `as unknown as User` casts mask type safety:**

- Issue: Several places cast to `any` or use double-cast `as unknown as User` to satisfy TypeScript, indicating the Prisma `select` projection type does not match the return type declaration.
- Files: `src/modules/users/users.service.ts` (lines 36, 108, 118, 131, 156), `src/modules/categories/categories.service.ts` (lines 141, 165), `src/modules/auth/auth.module.ts` (line 25)
- Impact: Loses compile-time safety; if the DB schema changes, the mismatch will surface only at runtime.
- Fix approach: Define narrow projection types using `Prisma.UserGetPayload<{ select: typeof userSelect }>` and return those types instead of the broad `User` type.

---

## Known Bugs

**Order number collision under concurrency:**

- Symptoms: Two simultaneous order creations within the same millisecond produce the same `orderNumber` (`ORD-<Date.now()>`), causing a Prisma unique constraint error (P2002) that bubbles up as a 500.
- Files: `src/modules/order/order.service.ts` (line 30)
- Trigger: Concurrent `POST /api/v1/orders` requests from multiple users in the same millisecond.
- Workaround: None — the transaction will throw.
- Fix approach: Use a DB sequence, UUID, or a nanoid-based approach: e.g., `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`.

**`GET /orders` has no pagination — returns all orders:**

- Symptoms: Admin requesting `GET /api/v1/orders` receives every order in the database as a single JSON array. No page/limit parameters are accepted.
- Files: `src/modules/order/order.service.ts` (lines 59-65), `src/modules/order/order.controller.ts`
- Trigger: Any `GET /orders` call by staff or admin on a production dataset.
- Workaround: None.
- Fix approach: Add `FindOrdersQueryDto extends PaginationDto` and pass `skip`/`take` to `prisma.order.findMany`.

**Order creation does not deduct product stock:**

- Symptoms: After a successful order, `product.stock` remains unchanged. Users can order out-of-stock products repeatedly without error.
- Files: `src/modules/order/order.service.ts` (lines 29-54)
- Trigger: Any order creation.
- Workaround: None.
- Fix approach: Inside the `$transaction`, add `tx.product.updateMany` to decrement stock for each order item and add a pre-check that `product.stock >= item.quantity`.

**`updateItemQuantity` returns `null` silently when quantity is 0:**

- Symptoms: `PATCH /cart/items/:id` with `{ quantity: 0 }` deletes the item but the API response wraps `null` in the standard envelope `{ statusCode: 200, success: true, data: null }`. Clients receive no explicit confirmation that the item was deleted.
- Files: `src/modules/cart/cart.service.ts` (lines 47-50)
- Trigger: Any cart item update with `quantity: 0`.
- Fix approach: Return a `204 No Content` or an explicit `{ deleted: true }` payload.

---

## Security Considerations

**Swagger UI is exposed in production with no authentication:**

- Risk: The full API schema including all endpoints, request/response shapes, and bearer auth is publicly accessible at `/api` in all environments including production.
- Files: `src/main.ts` (lines 51-58)
- Current mitigation: None — `NODE_ENV` is not checked before mounting Swagger.
- Recommendations: Gate Swagger behind `if (configService.get('NODE_ENV') !== 'production')`, or protect it with HTTP basic auth using `swagger-ui-express` options.

**`paymentMethod` is a free-form string — no validation against allowed values:**

- Risk: The payment method field in `CreatePaymentDto` accepts any string. There is no enum validation. An attacker can create payments with arbitrary method names (e.g., `"hacked"`) which pollutes analytics and may bypass downstream payment logic.
- Files: `src/modules/payment/dto/create-payment.dto.ts`, `src/modules/payment/payment.service.ts` (line 24)
- Current mitigation: None.
- Recommendations: Create a `PaymentMethod` enum (e.g., `cod`, `bank_transfer`, `credit_card`) and use `@IsEnum(PaymentMethod)` validation.

**`transactionId` in payments is client-supplied and unverified:**

- Risk: Clients submit their own `transactionId` string to `POST /payments`. There is no real payment gateway verification — any string is accepted and stored. `confirmPayment` only checks the DB record status, not an external gateway.
- Files: `src/modules/payment/payment.service.ts`, `src/modules/payment/dto/create-payment.dto.ts`
- Current mitigation: Only staff/admin can call `confirmPayment`, reducing fraud risk.
- Recommendations: Integrate a real payment gateway (Stripe, VNPay, etc.) with server-side verification. `transactionId` should be set by the gateway callback/webhook, not client input.

**Rate limiting is only applied to the auth controller — other endpoints are unthrottled:**

- Risk: Product search (`GET /products`), cart, order, and user endpoints have no per-IP rate limiting. Scrapers and DDoS attacks can exhaust DB connections.
- Files: `src/modules/auth/auth.controller.ts` (line 18), `src/app.module.ts` (ThrottlerModule config)
- Current mitigation: `ThrottlerGuard` is only applied via `@UseGuards(ThrottlerGuard)` on `AuthController`. The `ThrottlerModule` global config (ttl=60s, limit=10) is configured but not applied globally.
- Recommendations: Apply `ThrottlerGuard` globally via `APP_GUARD` provider in `AppModule`, or add it as a global guard in `main.ts`.

**Change-password does not revoke existing sessions:**

- Risk: After a user changes their password (e.g., after a suspected compromise), all existing refresh tokens and blacklisted access tokens remain valid. An attacker who obtained a refresh token retains access.
- Files: `src/modules/users/users.service.ts` (lines 162-181), `src/modules/users/users.controller.ts`
- Current mitigation: None.
- Recommendations: After updating the password hash, call `RefreshTokenService.revokeAllUserTokens(userId)`.

---

## Performance Bottlenecks

**`TokenBlacklist` is queried on every authenticated request:**

- Problem: Every JWT validation hits the `token_blacklist` DB table with a `findUnique` lookup. No caching layer (Redis, in-memory) is used.
- Files: `src/modules/auth/strategies/jwt.strategy.ts` (line 33), `src/modules/auth/services/token-blacklist.service.ts`
- Cause: The `isBlacklisted(token)` call is inside the Passport `validate()` hook, which runs on every protected request.
- Improvement path: Add a TTL-based in-memory cache (e.g., `lru-cache` or `@nestjs/cache-manager`) keyed by token hash. Entries expire when the token's natural JWT expiry passes. This eliminates DB round-trips for the vast majority of valid non-revoked tokens.

**Token blacklist and refresh token tables grow unboundedly — no automated cleanup:**

- Problem: `cleanupExpiredTokens()` methods exist in `TokenBlacklistService`, `RefreshTokenService`, and `EmailVerificationService`, but none are wired to a cron job or scheduled task. The tables accumulate rows indefinitely.
- Files: `src/modules/auth/services/token-blacklist.service.ts` (line 40), `src/modules/auth/services/refresh-token.service.ts` (line 154-165), `src/modules/auth/services/email-verification.service.ts` (line 85)
- Cause: `@nestjs/schedule` is not installed. The cleanup comment in `RefreshTokenService` explicitly says "should be called by cron job" but no cron is configured.
- Improvement path: Install `@nestjs/schedule`, create a `CleanupService` with `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` that calls all three cleanup methods.

**Full-text product search uses case-insensitive `contains` — no DB index:**

- Problem: `findAll` in `ProductsService` uses `{ contains: search, mode: 'insensitive' }` on `name` and `description` fields. This is a sequential scan with no supporting index.
- Files: `src/modules/products/products.service.ts` (lines 54-58), `prisma/schema.prisma` (Product model)
- Cause: No full-text search index or `@@index` on name/description in the Prisma schema.
- Improvement path: Add a GIN index on a `tsvector` column in Postgres, or use Prisma's `fullTextSearch` preview feature.

---

## Fragile Areas

**Order status transitions are enforced in application code, not the DB:**

- Files: `src/modules/order/order-transitions.util.ts` (referenced), `src/modules/order/order.service.ts`, `src/modules/payment/payment.service.ts`
- Why fragile: The `canTransition()` guard only runs through the NestJS service layer. Any direct DB write (migration, seed, admin SQL) bypasses all transition rules, creating invalid status combinations.
- Safe modification: Always go through `OrderService.updateStatus()` or `PaymentService.confirmPayment()`. Add the transition map as a comment to the schema.
- Test coverage: `src/modules/order/order-transitions.util.spec.ts` exists and covers transitions.

**`getOrCreateCart` in `CartService` has a TOCTOU race condition:**

- Files: `src/modules/cart/cart.service.ts` (lines 69-73)
- Why fragile: `findUnique` → `create` is not atomic. Two concurrent requests for the same `userId` can both find no cart and both attempt to create one; the second will fail with a unique constraint violation.
- Safe modification: Use `prisma.cart.upsert` or wrap in a transaction with `createOrConnect` semantics.
- Test coverage: Not tested.

**`Address` model exists in the DB schema but no module, controller, or service is implemented:**

- Files: `prisma/schema.prisma` (Address model, lines 104-122)
- Why fragile: The schema defines addresses with `onDelete: Cascade` from User, but since no API exists, addresses can only be created via seeding or raw SQL. Order creation accepts a `shippingAddress` as a freeform JSON object rather than referencing a stored address.
- Safe modification: Do not rename or alter the `Address` table without checking the order flow.
- Test coverage: None.

---

## Scaling Limits

**Single-instance token blacklist in PostgreSQL:**

- Current capacity: Suitable for development and low-traffic production (< ~10K active sessions).
- Limit: With high request rates, the per-request `tokenBlacklist` DB lookup becomes a bottleneck and connection-pool saturation point.
- Scaling path: Replace DB-based blacklist lookup with a Redis `SET` with TTL per revoked token. This reduces latency from ~5ms DB round-trip to ~0.5ms cache lookup.

**ThrottlerModule uses in-memory storage:**

- Current capacity: Works on a single process.
- Limit: Under horizontal scaling (multiple replicas on Render or K8s), each instance has its own rate-limit counter. A client can bypass the limit by distributing requests across replicas.
- Scaling path: Use `@nestjs/throttler` with a Redis storage adapter.

---

## Dependencies at Risk

**No email library is present:**

- Risk: The system has email verification and password-reset flows designed around sending emails, but `package.json` has no email transport dependency (no Nodemailer, SendGrid, Resend, etc.).
- Impact: Email features cannot be implemented without adding a dependency.
- Migration plan: Add `nodemailer` + `@nestjs-modules/mailer` or `@sendgrid/mail`.

---

## Missing Critical Features

**No real payment gateway integration:**

- Problem: Payment confirmation is a manual staff action (`POST /payments/:id/confirm`). There is no webhook endpoint, no payment provider SDK, and no cryptographic signature verification.
- Blocks: Cannot process real transactions; the `transactionId` field is meaningless without a gateway.

**No address management API:**

- Problem: The `Address` DB model exists but `src/modules/` has no address module, controller, or service.
- Blocks: Users cannot store, retrieve, or manage their delivery addresses via the API. Order creation requires clients to submit the full address as inline JSON each time.

**No OTP/2FA flow despite documented DTOs:**

- Problem: `ResendOtpDto` and `VerifyOtpDto` exist as full DTOs with documentation in `src/modules/auth/dto/`, and `ResendOtpResponse`/`VerifyOtpResponse` exist in `src/modules/auth/docs/auth.responses.ts`, but there are no corresponding controller endpoints, service methods, or OTP storage model in the schema.
- Blocks: The DTOs are dead code and will mislead future developers.

---

## Test Coverage Gaps

**Service layer has no unit tests:**

- What's not tested: `AuthService`, `UsersService`, `ProductsService`, `CategoriesService`, `CartService`, `OrderService`, `PaymentService`, `RefreshTokenService`, `TokenBlacklistService`, `EmailVerificationService`.
- Files: All `*.service.ts` files under `src/modules/`
- Risk: Business logic bugs (stock deduction, order transitions, token rotation) can regress silently.
- Priority: High

**E2E test is a trivial stub:**

- What's not tested: The only E2E test file (`test/app.e2e-spec.ts`) tests `GET /` → `Hello World!`, which is a placeholder. No auth flows, order flows, or payment flows are covered end-to-end.
- Files: `test/app.e2e-spec.ts`
- Risk: Integration regressions across the full request lifecycle go undetected.
- Priority: High

**Controller layer has no tests:**

- What's not tested: All HTTP request/response mapping, guard behavior, role enforcement, and decorator usage in controllers.
- Files: All `*.controller.ts` under `src/modules/`
- Risk: Guard misconfiguration (e.g., accidentally exposing an admin endpoint publicly) would not be caught.
- Priority: High

**`CartService.getOrCreateCart` race condition is not tested:**

- What's not tested: Concurrent cart creation for the same user.
- Files: `src/modules/cart/cart.service.ts`
- Risk: Silent unique-constraint failure in production.
- Priority: Medium

---

_Concerns audit: 2026-05-15_
