# Roadmap: E-Commerce API Hardening

**Created:** 2026-05-16
**Granularity:** coarse (4 phases)
**Core Value:** Mỗi module phải hoàn chỉnh và đúng — no known bugs, business logic tested, API hoạt động đúng thiết kế.
**Coverage:** 20/20 v1 requirements mapped

## Phases

- [ ] **Phase 1: Quick Wins — Security Gates & Infra** — Pure config/refactor: global rate limit, Swagger gating, type-safe Prisma projections, scheduled cleanup.
- [ ] **Phase 2: Order, Cart & Address** — Ship AddressModule and fix all order/cart correctness bugs in a single integrated transaction surface.
- [ ] **Phase 3: Email Transport & Auth Completion** — Replace email simulation with real transport, finish auth gaps, ship paymentMethod enum with backfill.
- [ ] **Phase 4: Test Coverage — Unit + E2E** — Establish shared E2E setup, service unit tests via mockDeep Prisma, E2E for auth + order flows.

## Phase Details

### Phase 1: Quick Wins — Security Gates & Infra

**Goal:** Tighten security and code-quality of the existing surface without touching schema, by gating Swagger, enforcing global rate limits, removing unsafe casts, and scheduling token cleanup.
**Depends on:** Nothing (first phase)
**Requirements:** SEC-01, SEC-03, INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):

1. `GET /api/docs` returns 404 when `NODE_ENV=production`, and serves Swagger UI in development/staging.
2. Every authenticated endpoint (not just `/auth/*`) returns `429 Too Many Requests` after exceeding the configured throttle limit.
3. A daily scheduled job removes expired rows from `TokenBlacklist`, `RefreshToken`, and `EmailVerification`, observable via logs at next midnight tick.
4. The codebase contains zero `as any` / `as unknown as User` casts in `users`, `auth`, and `categories` modules; `FindProductsQueryDto` and `FindUsersQueryDto` extend `PaginationDto`.
   **Plans**: TBD

### Phase 2: Order, Cart & Address

**Goal:** Deliver complete address management and eliminate every known correctness bug in the cart-to-order pipeline.
**Depends on:** Phase 1
**Requirements:** ORD-01, ORD-02, ORD-03, CART-01, ADDR-01, ADDR-02, ADDR-03
**Success Criteria** (what must be TRUE):

1. User can create, list, update, delete addresses under `/users/me/addresses` and mark exactly one as default (the previous default is automatically unset).
2. Creating an order with `addressId` decrements product stock atomically — if any item's stock is insufficient, the order fails and no stock is changed; the order persists a snapshot of the shipping address.
3. Order numbers remain unique under concurrent creation (format `ORD-{Date.now()}-{nanoid(6)}`); `GET /orders` returns paginated `{ data, page, limit, total }`.
4. `PATCH /cart/items/:id` with `quantity: 0` removes the item and returns `204 No Content` (never naked `null`).

**Plans:** 4 plans

Plans:

- [ ] 02-01-PLAN.md — Infra: install nanoid@3 + TransformResponseInterceptor 204 bypass
- [ ] 02-02-PLAN.md — AddressModule CRUD + atomic isDefault toggle + delete-default guard
- [ ] 02-03-PLAN.md — OrderService bug fixes: stock decrement + nanoid orderNumber + addressId snapshot + paginated findAll
- [ ] 02-04-PLAN.md — Cart PATCH /cart/items/:id qty=0 → 204 via @Res passthrough

### Phase 3: Email Transport & Auth Completion

**Goal:** Make registration/password flows truly work end-to-end with real emails and finish the auth surface, including a safe paymentMethod enum migration.
**Depends on:** Phase 1
**Requirements:** EMAIL-01, AUTH-01, AUTH-02, AUTH-03, SEC-02
**Success Criteria** (what must be TRUE):

1. Register/forgot-password sends a real email via `@nestjs-modules/mailer` + Nodemailer (Mailtrap dev / Brevo prod); the `[EMAIL SIMULATION]` log path no longer executes.
2. Startup fails fast if `FRONTEND_URL` is missing/invalid (Joi); password-reset links use `FRONTEND_URL`, never `https://example.com`.
3. `logoutAll` revokes all active access tokens of the user, and `changePassword` revokes all of that user's refresh tokens — subsequent requests with old tokens return 401.
4. `paymentMethod` accepts only `cod`, `bank_transfer`, `credit_card` (enum + `@IsEnum`); existing rows have been backfilled via migration with zero rejected values in production data.
   **Plans**: TBD

### Phase 4: Test Coverage — Unit + E2E

**Goal:** Reach a credible portfolio test pyramid: shared bootstrap, service-layer unit tests with mocked Prisma, and E2E coverage of the two critical flows.
**Depends on:** Phase 2, Phase 3
**Requirements:** TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):

1. `configureApp(app)` is extracted from `main.ts` and used by both production bootstrap and the E2E test setup (same pipes, filters, prefix).
2. `jest --coverage` reports unit-test coverage for `AuthService`, `UsersService`, `ProductsService`, `CategoriesService`, `CartService`, `OrderService`, `PaymentService` meeting the configured threshold (≥70% lines / ≥60% branches).
3. E2E suite runs the full auth flow (register → verify email → login → refresh → logout) and order flow (add to cart → create order → payment) green, with `@chax-at/transactional-prisma-testing` rolling back between tests.
   **Plans**: TBD

## Progress

| Phase                                  | Plans Complete | Status      | Completed |
| -------------------------------------- | -------------- | ----------- | --------- |
| 1. Quick Wins — Security Gates & Infra | 0/0            | Not started | -         |
| 2. Order, Cart & Address               | 0/4            | Not started | -         |
| 3. Email Transport & Auth Completion   | 0/0            | Not started | -         |
| 4. Test Coverage — Unit + E2E          | 0/0            | Not started | -         |

## Coverage Validation

All 20 v1 requirements mapped to exactly one phase. No orphans, no duplicates.

| Phase     | Requirements                                               | Count  |
| --------- | ---------------------------------------------------------- | ------ |
| 1         | SEC-01, SEC-03, INFRA-01, INFRA-02, INFRA-03               | 5      |
| 2         | ORD-01, ORD-02, ORD-03, CART-01, ADDR-01, ADDR-02, ADDR-03 | 7      |
| 3         | EMAIL-01, AUTH-01, AUTH-02, AUTH-03, SEC-02                | 5      |
| 4         | TEST-01, TEST-02, TEST-03                                  | 3      |
| **Total** |                                                            | **20** |

---

_Roadmap created: 2026-05-16_
