# Research Synthesis - E-Commerce API Hardening Milestone

Project: NestJS 11 + Prisma 6 + PostgreSQL 16 e-commerce backend (brownfield)
Synthesized: 2026-05-16
Inputs: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
Overall confidence: HIGH

## Executive Summary

This milestone hardens an existing NestJS e-commerce monolith with 7 working modules. The core stack stays fixed; additions are supplementary (email transport, test mocking libs, scheduler). Work is overwhelmingly about correctness, security gating, and test coverage rather than new modules. The single new module is AddressModule, which uses the already-defined Address Prisma table.

Biggest portfolio-credibility risks visible within five minutes: (1) order creation does not deduct stock, (2) Swagger exposed in production, (3) zero service-layer tests, (4) orphan Address schema model with no API, (5) email flows only log simulated output.

Risk profile is low-to-medium. Concurrency-sensitive items (stock deduction, order-number, cart upsert, address default invariant) require atomic SQL via prisma.transaction + updateMany with WHERE guards. The riskiest sequencing item is the paymentMethod enum migration - backward-incompatible, requires data audit and backfill BEFORE the Prisma enum is applied.

## Key Findings

### Stack additions (HIGH confidence)

- Email module: @nestjs-modules/mailer + nodemailer + handlebars (^2.0.2 / ^7.x / ^4.7.x)
- Dev email sink: Mailtrap Sandbox
- Prod email transport: Brevo SMTP (300/day free); Resend (3000/mo, 100/day) alternative
- Prisma mocking: jest-mock-extended mockDeep PrismaClient ^4.0.0 (officially recommended by Prisma docs)
- E2E rollback: @chax-at/transactional-prisma-testing ^1.x (10-100x faster than truncate/reseed)
- Scheduler: @nestjs/schedule for token cleanup cron
- Address API: no new dep; uses existing NestJS + Prisma + class-validator

No framework change, no ORM swap, no Redis. SendGrid excluded (free tier removed 2025-2026).

### Table-stakes features (must ship)

Bug fixes:

1. Stock deduction in OrderService.create via atomic updateMany WHERE stock gte qty inside transaction.
2. Order-number collision fix - append nanoid(6) to Date.now() or use Postgres sequence.
3. GET /orders pagination via PaginationDto.
4. Cart quantity=0 returns 204 No Content (not naked null).
5. CartService.getOrCreateCart -> prisma.cart.upsert (fixes TOCTOU race).

Missing features: 6. AddressModule - full CRUD under /api/v1/addresses + PATCH /:id/default. Owner-scoped via JWT. isDefault invariant in transaction. Order snapshots into existing Order.shippingAddressSnapshot (Json). 7. Real email transport - @nestjs-modules/mailer + Handlebars file templates. transporter.verify() at onModuleInit. 8. FRONTEND_URL Joi-validated; password-reset URL fixed. Staged rollout: set env first, then enforce. 9. TasksModule with @Cron EVERY_DAY_AT_MIDNIGHT waitForCompletion:true calling existing cleanup methods via Promise.allSettled.

Security gates: 10. Swagger gated behind explicit allowlist (development or staging) - not denylist. 11. Global rate limiting via APP_GUARD + ThrottlerGuard + trust-proxy=1 for Render. 12. paymentMethod enum (cod, bank_transfer, credit_card) - MANDATORY data audit + backfill BEFORE Prisma enum migration. 13. Change-password revokes all refresh tokens (implement revokeAllUserTokens).

Test coverage: 14. Service unit tests via mockDeep PrismaClient - priority Order > Auth > Payment > Cart > Users > Products. Target 70 percent lines / 60 percent branches. 15. E2E tests for auth + order flows. Extract configureApp(app) from main.ts for shared global pipes.

### Architecture decisions (HIGH confidence)

- No repository layer; Prisma IS the data-access layer.
- Prisma.UserGetPayload + satisfies pattern replaces all as-any casts in users/auth/categories. Do this BEFORE adding AddressModule.
- AddressModule exports AddressService, imported by OrderModule. No circular dep.
- Snapshot, not FK, for Order.shippingAddressSnapshot. Industry standard (Shopify/WooCommerce).
- APP_GUARD pattern for global throttler (DI-friendly); never useGlobalGuards hand-instantiated.
- Co-located \*.spec.ts unit tests; test/ for E2E split per-flow.

### Top 5 pitfalls to watch

1. CRITICAL - Stock overselling via read-then-write race. Pattern check-then-update is wrong even inside transaction at READ COMMITTED. Fix: single-statement updateMany WHERE stock gte qty; throw BadRequestException if count===0.
2. CRITICAL - Order-number Date.now() collisions. Append nanoid(6) suffix or use Postgres sequence.
3. CRITICAL - paymentMethod enum backward-incompatibility. Required sequence: SELECT DISTINCT audit -> backfill migration -> Prisma enum. Never ship the enum without the backfill.
4. MODERATE - Cron multi-instance lock storms + first-run unbounded delete. Render free tier single-instance so OK now; document. Batch first cleanup deletes; index expiresAt. pg_try_advisory_lock if ever scaled.
5. MODERATE - Over-mocked Prisma tests become tautologies. Mock at the boundary; assert on return values and thrown exceptions, not just toHaveBeenCalledWith. Use real pure utilities (OrderTransitionsUtil).

Honorable mentions: missing await on expect-rejects-toThrow; SMTP verify() not called at startup; Swagger gate denylist loads during tests; global throttler tripping E2E (override guard in test module).

## Implications for Roadmap

Suggested grouping: 4 coarse phases plus an optional Phase 5 for differentiators.

### Phase 1 - Quick wins: security gates, type-safety, scheduler

Rationale: Pure config + co-located refactor. Zero schema change. Highest visibility per line of code.
Includes: Global APP_GUARD ThrottlerGuard + trust proxy; Swagger allowlist gate; Prisma.GetPayload + satisfies across users/auth/categories; TasksModule + ScheduleModule.forRoot() wiring to cleanup methods; index on expiresAt.
Avoids: Pitfalls 6, 12, 17. Research flag: None.

### Phase 2 - Address + Order integration + Order/Cart bug fixes

Rationale: Address must exist before Order references it. Stock deduction and order-number fix sit in the same OrderService.create transaction edit - consolidate with Address wiring.
Includes: AddressModule (CRUD, ownership-scoped, isDefault invariant in transaction); Order DTO migrates to addressId + snapshot into shippingAddressSnapshot; stock deduction via atomic updateMany; order-number nanoid(6); GET /orders pagination; cart upsert; cart quantity=0 -> 204.
Avoids: Pitfalls 1, 2, 3, 13. Research flag: None.

### Phase 3 - Email transport + auth completion + paymentMethod enum

Rationale: Vertical slice; can run partially parallel with Phase 2. Unblocks registration flow currently broken behind email simulation.
Includes: MailModule + Handlebars templates; Mailtrap/Brevo SMTP env config + Joi; FRONTEND_URL staged rollout; replace EMAIL SIMULATION calls; transporter.verify() at init; TokenBlacklistService.revokeUserTokens() + called on change-password; paymentMethod enum WITH mandatory audit + backfill migration first.
Avoids: Pitfalls 4, 5, 7, 8, 15. Research flag: Light - verify Render SMTP egress on 587/465; confirm Brevo DNS.

### Phase 4 - Test coverage: unit + E2E

Rationale: Single biggest portfolio differentiator. Dedicated phase ensures full pyramid + coverage threshold.
Includes: Extract configureApp(app); service unit tests via mockDeep PrismaClient (priority order); E2E suites for auth/order/address/payment; @chax-at/transactional-prisma-testing setup with separate ecommerce_test DB; coverageThreshold in jest.config; override ThrottlerGuard in E2E module; ESLint jest/valid-expect-in-promise; Jest resetMocks:true.
Avoids: Pitfalls 9, 10, 11, 15, 17. Research flag: Light - validate @chax-at/transactional-prisma-testing Fluent API caveat against actual project usage at Phase 4 kickoff.

### Optional Phase 5 - Differentiators

GitHub Actions CI, idempotency keys on POST /orders, nestjs-pino structured logging, OpenAPI export, README badges/ADRs. Stretch slice - none are blockers.

## Confidence Assessment

- Stack: HIGH - Verified via Context7, official npm/docs, 2026 provider pages
- Features: HIGH - Existing .planning/codebase/CONCERNS.md is comprehensive and recent
- Architecture: HIGH - Context7 confirmed APP_GUARD, ScheduleModule, Prisma.GetPayload
- Pitfalls: HIGH (primary) / MEDIUM (community) - Cite Prisma docs, Zalando, Google AIP-180

### Gaps and open questions

1. Render SMTP egress - verify Brevo port 587/465 connectivity at Phase 3 start. Fallback: Resend HTTP API.
2. @chax-at/transactional-prisma-testing Fluent API caveat - audit candidate E2E scenarios at Phase 4 kickoff.
3. Existing paymentMethod data - distinct values unknown until audit. First step of Phase 3.

### Conflicts between research files (resolved)

- Address isDefault enforcement: STACK.md (partial unique index + service code) vs ARCHITECTURE.md (service transaction only). Resolution: Service-layer enforcement for v1; partial index optional defense-in-depth.
- Address delete semantics: STACK.md (soft delete via deletedAt) vs ARCHITECTURE.md (hard delete + snapshot preserves history). Resolution: Hard delete; snapshot guarantees order-history integrity. Document via ADR.
- Email provider preference: FEATURES.md leans Resend (DX), STACK.md leans Brevo SMTP (higher free cap). Both via @nestjs-modules/mailer. Resolution: Default to Brevo for higher daily cap; one-line env swap to Resend if preferred.

## Sources (aggregated)

Primary (HIGH): Prisma docs (testing, transactions, GetPayload); @nestjs-modules/mailer npm/docs; @nestjs/schedule + @nestjs/throttler via Context7; NestJS docs.nestjs.com#2174 (E2E ValidationPipe); NestJS nest#1843 (E2E rollback); Brevo/Resend/Mailtrap pricing (May 2026); Zalando RESTful API Guidelines; Google AIP-135, AIP-180.

Secondary (MEDIUM): jest-mock-extended + @chax-at/transactional-prisma-testing community usage; NestJS testing tutorials (tomray.dev, Amplication, LogRocket); Render free-tier sleep docs; Shopify/WooCommerce snapshot precedent.

Codebase evidence (HIGH): .planning/codebase/CONCERNS.md, .planning/codebase/ARCHITECTURE.md, prisma/schema.prisma (Address lines 104-122; Order.shippingAddressSnapshot line 160), existing soft-delete conventions.

Research synthesis: 2026-05-16
