# Feature Landscape — E-Commerce API Hardening Milestone

**Domain:** Portfolio-quality e-commerce REST API (NestJS + Prisma + PostgreSQL)
**Milestone type:** Brownfield hardening (existing 7 modules, completing/fixing gaps)
**Researched:** 2026-05-16
**Overall confidence:** HIGH

## Executive Summary

This is NOT a greenfield "what should an e-commerce API have" question. The codebase already has the seven foundational modules (auth, users, categories, products, cart, order, payment). The gap analysis in `.planning/codebase/CONCERNS.md` is comprehensive and the items below align with what a reviewer/interviewer scanning this repo for portfolio credibility would flag. Recommendations are filtered through three lenses: (1) does it make existing modules **correct**, (2) does it close a **visible** gap a reviewer can spot in 5 minutes, (3) does it stay within "portfolio scale" (no Redis, no Stripe SDK, no horizontal-scaling infra).

The biggest credibility risks today are: (a) order creation that doesn't deduct stock (instant red flag — every reviewer tests this), (b) Swagger exposed in production (security 101), (c) zero service-layer tests in a NestJS project (NestJS culture expects Jest unit tests), and (d) an `Address` Prisma model with no module behind it (visible dead code in the schema).

---

## Table Stakes

Features a reviewer expects to work correctly. Their absence makes the repo feel half-finished or "demo-ware." All items below map to entries in `PROJECT.md → Active` or `CONCERNS.md`.

### Correctness of existing modules (bug fixes)

| Feature                               | Why Expected                                                                                                                                                     | Complexity | Notes                                                                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stock deduction on order creation** | Any e-commerce reviewer runs this scenario first: order the same item twice. If `product.stock` doesn't change, the system is fundamentally broken.              | Medium     | Must happen inside `prisma.$transaction` with a pre-check (`stock >= quantity`). Throw `ConflictException` on insufficient stock. Reference: `order.service.ts:29-54` |
| **Order number collision prevention** | `ORD-${Date.now()}` collides under millisecond-level concurrency. Reviewers familiar with Node.js spot this in seconds.                                          | Low        | Append nanoid or `Math.random().toString(36).slice(2,7)`. Alternatively, use a Postgres sequence.                                                                     |
| **`GET /orders` pagination**          | Returning the entire orders table is the canonical "I forgot pagination" mistake. Already paginated for products/users — the inconsistency itself is a red flag. | Low        | Create `FindOrdersQueryDto extends PaginationDto`. Wire `skip`/`take` and return `{ data, total, page, limit }`.                                                      |
| **Cart item `quantity=0` response**   | Silently returning `{ data: null }` on delete is poor REST design. Either `204 No Content` or `{ deleted: true }`.                                               | Low        | Pick one consistently. 204 is more idiomatic REST.                                                                                                                    |
| **Cart `getOrCreateCart` TOCTOU fix** | The `findUnique → create` pattern races on concurrent first-add. Two simultaneous "add to cart" requests on a new user crash the second one with P2002.          | Low        | Replace with `prisma.cart.upsert({ where: { userId }, create: {...}, update: {} })`.                                                                                  |

### Critical missing functionality

| Feature                                               | Why Expected                                                                                                                                                                                            | Complexity | Notes                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Address management API**                            | The `Address` model is already in `schema.prisma` but has no controller/service. A reviewer opening the schema and seeing an orphan table will note it. Standard e-commerce includes "saved addresses." | Medium     | New `AddressModule`: `GET/POST/PATCH/DELETE /addresses`, `POST /addresses/:id/default`. Order creation should optionally accept `addressId` (preferred) or inline `shippingAddress` (legacy/fallback).                                                     |
| **Real email transport**                              | All email is `[EMAIL SIMULATION]` logger output. Verification flow, password reset, and OTP DTOs are documented but non-functional. Deploy to Render and try to register → user is locked out.          | Medium     | Add `nodemailer` + `@nestjs-modules/mailer` (free, SMTP-based) OR `resend` (free tier, modern DX). Inject `EmailService`, replace simulation calls. SMTP credentials via env vars. **Recommend Resend** for portfolio polish — cleaner DX, easier to demo. |
| **`FRONTEND_URL` validated + password-reset URL**     | Password reset link hardcoded to `https://example.com` — embarrassing on any code-review. Also unvalidated at startup so it silently falls back to `localhost` in prod.                                 | Low        | Add `FRONTEND_URL: Joi.string().uri().required()` to `env.validation.ts`. Replace hardcoded URL in `forgotPassword()`.                                                                                                                                     |
| **Swagger gated in production**                       | Exposing the full API contract publicly in prod is a security 101 finding.                                                                                                                              | Low        | Wrap `SwaggerModule.setup()` in `if (config.get('NODE_ENV') !== 'production')`. Optionally: basic-auth gate the route instead.                                                                                                                             |
| **`paymentMethod` enum**                              | Accepting any string for payment method is sloppy. Trivial fix, very visible in the DTO.                                                                                                                | Low        | Define `PaymentMethod` enum (`cod`, `bank_transfer`, `credit_card`). Use `@IsEnum()` in `CreatePaymentDto`.                                                                                                                                                |
| **Global rate limiting**                              | Currently only `AuthController` has `@UseGuards(ThrottlerGuard)`. Products/cart/orders are unthrottled — visible by reading `app.module.ts`.                                                            | Low        | Register `ThrottlerGuard` as `APP_GUARD` provider in `AppModule`. Optionally allow per-route `@Throttle()` overrides for auth (stricter) and product browsing (looser).                                                                                    |
| **Change-password revokes sessions**                  | Standard security expectation: after password change, old refresh tokens must be invalidated.                                                                                                           | Low        | After `prisma.user.update({ password })`, call `refreshTokenService.revokeAllUserTokens(userId)`.                                                                                                                                                          |
| **Email verification flow actually works end-to-end** | `EmailVerificationService` exists but depends on email simulation. Once real email is wired, the full register → click link → verified flow must work.                                                  | Medium     | Mostly unblocked by the "real email transport" item above. Verify the `/verify-email?token=...` endpoint actually validates and marks user as verified.                                                                                                    |

### Test coverage (this is the single biggest portfolio differentiator)

The current state — only utility functions tested — is the most common "this repo is unfinished" signal. NestJS culture strongly expects Jest unit tests with mocked Prisma.

| Feature                      | Why Expected                                                                                                   | Complexity | Notes                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Service-layer unit tests** | Reviewers run `npm test` first. Empty results = no engineering rigor. Target the high-business-logic services. | High       | **Priority order:** `OrderService` (state machine, stock, transactions) > `AuthService` (token rotation, password reset) > `PaymentService` (confirm flow + status transition) > `CartService` (upsert, quantity edge cases) > `UsersService` (soft-delete, password change) > `ProductsService`. Mock `PrismaService` using `jest-mock-extended` or manual mocks. |
| **E2E happy-path tests**     | The current `test/app.e2e-spec.ts` tests `GET /` → "Hello World!". Embarrassing.                               | Medium     | Minimum two E2E suites: (1) **Auth flow** — register → verify → login → access protected → refresh → logout. (2) **Order flow** — login → add to cart → create order → confirm payment → check order status `confirmed`. Use a separate test DB or SQLite + `prisma migrate reset`.                                                                                |
| **Coverage threshold**       | A `coverageThreshold` in `jest.config` is a visible signal of discipline.                                      | Low        | **Recommend 70% lines / 60% branches** for services. Not 100% (overkill for portfolio, leads to test theater). Excluded: DTOs, modules, `main.ts`, decorators.                                                                                                                                                                                                     |

**Coverage expectation guidance (HIGH confidence):**

- Reviewers don't usually check the number itself; they check "is there a `coverage/` artifact and does it look real?"
- 70% line coverage on services with E2E for two critical flows is the sweet spot for portfolio credibility.
- A README badge with the coverage % (or a screenshot) communicates this without requiring the reviewer to run the suite.

### Security expectations (e-commerce baseline)

| Feature                                                        | Why Expected                                                               | Complexity | Notes                                                                                                  |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Helmet enabled                                                 | Already done — keep it.                                                    | —          | `main.ts` already calls `app.use(helmet())`. Verify CSP is appropriate when Swagger is enabled in dev. |
| Strict CORS in production                                      | Currently likely permissive.                                               | Low        | Restrict `origin` to `FRONTEND_URL` in production; allow `*` only in dev.                              |
| `ValidationPipe` with `whitelist + forbidNonWhitelisted`       | Already done globally.                                                     | —          | Keep.                                                                                                  |
| Password hash: bcrypt with cost ≥ 10                           | Verify current cost.                                                       | —          | Check `PasswordService`. 10–12 is standard.                                                            |
| JWT access token short-lived (≤15min) + refresh token rotation | Already done.                                                              | —          | Confirm refresh token reuse triggers revocation chain (token theft detection).                         |
| HTTPS-only cookies / Secure flag (if cookies used)             | If refresh token in cookie, must be `httpOnly + secure + sameSite=strict`. | Low        | Check current implementation — appears to be bearer-token-only based on architecture doc.              |
| No secrets in logs                                             | Verify the email simulation logger doesn't dump tokens.                    | Low        | Quick audit pass once real email is wired.                                                             |

---

## Differentiators

Features that elevate the repo from "completed bootcamp project" to "this person ships production-grade code." Not required, but each one is a visible win.

| Feature                                                     | Value Proposition                                                                                                                                                                                                                              | Complexity | Notes                                                                                                                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scheduled cleanup job** (`@nestjs/schedule`)              | `TokenBlacklist`, `RefreshToken`, and `EmailVerification` tables already have `cleanupExpiredTokens()` methods — wiring them to a daily cron shows understanding of operational concerns. Highly visible to reviewers reading `app.module.ts`. | Low        | Install `@nestjs/schedule`. Create `CleanupService` with `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`. ~30 lines of code, large signal.                  |
| **Stock reservation timeout**                               | Held cart items don't reserve stock — only on order creation. A short-lived "reservation" during checkout demonstrates real-world thinking.                                                                                                    | High       | Probably skip; complexity > signal at portfolio scale. Mention in README "future work."                                                                   |
| **Inventory audit log**                                     | `StockMovement` table that records every stock change (order, refund, manual adjust) with reason.                                                                                                                                              | Medium     | Solid differentiator if Phase has slack. Read-only `GET /products/:id/stock-history` for admins.                                                          |
| **Order cancellation refund flow**                          | `pending`/`confirmed` orders can be cancelled by user, refunds stock automatically.                                                                                                                                                            | Medium     | Already partially supported by state machine (`cancelled`, `refunded` states exist). Wire stock restoration. Tests this on a real e-commerce review path. |
| **Idempotency keys on `POST /orders` and `POST /payments`** | `Idempotency-Key` header to prevent duplicate order creation on retry. Industry-standard pattern (Stripe-style).                                                                                                                               | Medium     | Store key + response in a DB table for 24h. Strong signal of API design maturity.                                                                         |
| **API versioning visible in URL**                           | Already done — `/api/v1`. Keep.                                                                                                                                                                                                                | —          | Document the policy in README.                                                                                                                            |
| **Structured logging** (correlation ID propagation)         | Already partially done with `CorrelationIdMiddleware`. Extend to log records (pino or winston) instead of NestJS default logger.                                                                                                               | Medium     | pino + `nestjs-pino` gives JSON logs with correlation ID auto-injected — visible "production-ready" signal.                                               |
| **GitHub Actions CI** (test + lint + build)                 | If absent, add. Tests running on PR is a baseline production-readiness signal.                                                                                                                                                                 | Low        | One YAML file. Big README badge payoff.                                                                                                                   |
| **OpenAPI schema export**                                   | `npm run swagger:export` produces a `openapi.json` artifact alongside the live Swagger UI.                                                                                                                                                     | Low        | Useful for client SDK generation and demonstrates API-first thinking.                                                                                     |
| **Soft-delete consistency audit**                           | Some models use `deletedAt`, some don't. Pick one pattern and document it.                                                                                                                                                                     | Low        | README + ADR.                                                                                                                                             |
| **Webhook endpoint scaffolding for payment**                | Even without a real gateway, a signed webhook endpoint (`POST /webhooks/payment` with HMAC verification) demonstrates the integration shape.                                                                                                   | Medium     | Keeps gateway integration as "Phase next" but shows the architecture is ready.                                                                            |

---

## Anti-Features

Things explicitly NOT to build in this milestone. Each is justified by either complexity-vs-signal ratio or "out of portfolio scale."

| Anti-Feature                                                               | Why Avoid                                                                                                                                                                                              | What to Do Instead                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Real payment gateway integration** (Stripe, VNPay)                       | Requires real merchant accounts, KYC, sandbox setup, webhook tunneling. Massive scope creep for a portfolio milestone. Already declared out of scope in `PROJECT.md`.                                  | Keep manual `confirmPayment` by staff. Add a clear README section "Payment gateway integration is out of scope — `transactionId` is currently staff-supplied." Add the webhook scaffolding (above) as a "shape demo" instead. |
| **OTP / 2FA**                                                              | DTOs exist (`ResendOtpDto`, `VerifyOtpDto`) but no storage model, no controller endpoints, no SMS/email OTP transport. Half-built feature is worse than no feature — delete the DTOs or defer cleanly. | Either delete the dead DTOs/responses now (cleanliness signal) or wait for a future milestone. Recommend **delete** in this milestone with a comment "OTP deferred — see issue #X."                                           |
| **Redis-backed token blacklist**                                           | Optimization for scale. At portfolio scale, the per-request DB lookup is fine. Adding Redis adds infra complexity (new service, env vars, healthcheck) for a non-visible win.                          | In-memory LRU cache as a middle ground IF tests show the DB lookup is actually slow — otherwise leave as-is and add an ADR explaining the tradeoff.                                                                           |
| **Full-text search with GIN index**                                        | The Postgres `contains` `mode: 'insensitive'` is fine for small product catalogs. GIN/tsvector setup adds migration complexity for a feature that won't be exercised at portfolio scale.               | Leave as-is. Add a comment in `ProductsService.findAll` referencing the optimization path.                                                                                                                                    |
| **Repository abstraction layer**                                           | Already declared as Anti-pattern in `ARCHITECTURE.md`. Prisma's query API is the data-access layer. Adding repositories adds files without adding value at this scale.                                 | Don't. If query duplication grows, extract reusable `Prisma.UserFindManyArgs` helpers per domain.                                                                                                                             |
| **Horizontal scaling concerns** (multi-replica throttler, sticky sessions) | Render free tier is single-instance anyway.                                                                                                                                                            | Document as scaling considerations in `ARCHITECTURE.md`.                                                                                                                                                                      |
| **Reviews / ratings / wishlists**                                          | Common e-commerce features but **out of scope for a hardening milestone**. The goal here is "make existing modules correct," not "add more modules."                                                   | Defer to a "Phase 2 features" milestone if desired.                                                                                                                                                                           |
| **Coupons / discounts / promo codes**                                      | Same as above — feature creep that distracts from the hardening focus.                                                                                                                                 | Defer.                                                                                                                                                                                                                        |
| **Multi-currency / tax calculation**                                       | Major scope, requires external tax API or hardcoded rules.                                                                                                                                             | Defer. Document `subtotal` as "pre-tax, single-currency" in API docs.                                                                                                                                                         |
| **Multi-tenancy / multi-vendor**                                           | This is a single-tenant storefront. Don't pretend otherwise.                                                                                                                                           | Defer.                                                                                                                                                                                                                        |
| **GraphQL alongside REST**                                                 | Doubles the surface area and tests.                                                                                                                                                                    | Stay REST.                                                                                                                                                                                                                    |
| **WebSocket order status updates**                                         | Nice-to-have but requires socket gateway + client. Disproportionate effort.                                                                                                                            | Polling on `GET /orders/:id` is fine for portfolio scope.                                                                                                                                                                     |
| **Image upload + S3 integration for product images**                       | Adds infrastructure (S3 bucket, presigned URLs) for a feature that's tangential to the API correctness focus.                                                                                          | Accept `imageUrl: string` in product DTO and let it be a freeform URL. Document the limitation.                                                                                                                               |
| **100% test coverage**                                                     | Test theater. Encourages testing trivial code (constructors, simple getters) and discourages testing hard things.                                                                                      | Target 70% lines / 60% branches on services, 0% required on DTOs/modules.                                                                                                                                                     |

---

## Feature Dependencies

```
Real Email Transport
  ├─→ Email Verification Flow (works end-to-end)
  ├─→ Password Reset Flow (link goes to right URL)
  └─→ FRONTEND_URL validation (prerequisite)

Address API
  └─→ Order creation accepts addressId (preferred path)

Stock Deduction
  ├─→ Order Cancellation Refund (must restore stock)
  └─→ Stock Movement Audit (optional differentiator)

Global Rate Limiting
  └─→ Per-route @Throttle() overrides (auth stricter, browse looser)

Service Unit Tests
  └─→ E2E Tests (E2E catches what unit tests miss, both needed)

@nestjs/schedule Cleanup Job
  └─→ Depends on existing cleanup methods (no new schema work)
```

---

## MVP Recommendation for This Milestone

If forced to ship in a single sprint, prioritize:

**Must ship (Phase 1 of milestone — correctness):**

1. Stock deduction in order creation (+ test)
2. Order number collision fix
3. `GET /orders` pagination
4. Cart `quantity=0` response cleanup + `getOrCreateCart` upsert
5. `paymentMethod` enum
6. Service unit tests for `OrderService`, `AuthService`, `PaymentService`, `CartService`

**Must ship (Phase 2 — features + security):** 7. Address module 8. Real email transport (Resend) 9. `FRONTEND_URL` validation + password reset URL fix 10. Swagger gated in production 11. Global rate limiting 12. Change-password revokes sessions 13. E2E test for auth flow + order flow

**Should ship (Phase 3 — polish + differentiators):** 14. `@nestjs/schedule` cleanup cron 15. Delete dead OTP DTOs (or implement, but delete is faster signal) 16. GitHub Actions CI 17. Coverage threshold in `jest.config` 18. README with badges, ADRs, architecture diagram link

**Optional polish:**

- Idempotency keys on `POST /orders`
- Structured logging with pino
- Webhook scaffolding for payment

---

## Confidence Assessment

| Claim                                                        | Confidence | Source                                                                                                                                      |
| ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Codebase gap analysis is accurate                            | HIGH       | `.planning/codebase/CONCERNS.md` is detailed and recent (2026-05-15)                                                                        |
| Table-stakes feature list matches reviewer expectations      | HIGH       | Standard e-commerce + NestJS conventions; corroborated by web search                                                                        |
| Stock + collision + pagination are first-tested by reviewers | HIGH       | These are textbook bug categories; visible by reading the order service                                                                     |
| Resend > Nodemailer for portfolio polish                     | MEDIUM     | Subjective DX call; both work. Resend has cleaner setup + free tier; Nodemailer has zero dependencies on a 3rd party. Either is defensible. |
| 70% coverage threshold is the right number                   | MEDIUM     | Industry convention; no hard data, but 100% is wasteful and <50% is unconvincing                                                            |
| Delete dead OTP DTOs > keep them                             | MEDIUM     | Cleanliness signal vs. future-work documentation. Both defensible.                                                                          |
| Anti-features list (payment gateway, OTP, Redis)             | HIGH       | Already declared out of scope in `PROJECT.md`                                                                                               |

---

## Sources

- [.planning/PROJECT.md](.planning/PROJECT.md) — Active requirements list, out-of-scope decisions
- [.planning/codebase/CONCERNS.md](.planning/codebase/CONCERNS.md) — Bug catalogue, security gaps, missing features
- [.planning/codebase/ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md) — Module layout, anti-patterns, cross-cutting concerns
- [18 API Project Ideas to Build Your Portfolio in 2026](https://strapi.io/blog/api-project-ideas)
- [NestJS Security Defaults — 7 Switches](https://medium.com/@duckweave/nestjs-security-defaults-7-switches-youll-thank-yourself-for-b9ff3f4ea026)
- [Secure Your NestJS Application: Production-Ready Defaults](https://medium.com/@s_malyshev/secure-your-nestjs-application-production-ready-defaults-for-safety-and-dx-1b6896b1ce74)
- [Rate Limiting — NestJS Docs](https://docs.nestjs.com/security/rate-limiting)
- [Helmet — NestJS Docs](https://docs.nestjs.com/security/helmet)
- [Swagger Recipe — NestJS Docs](https://docs.nestjs.com/recipes/swagger)
