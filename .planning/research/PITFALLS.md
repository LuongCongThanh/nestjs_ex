# Domain Pitfalls — NestJS E-Commerce API Hardening

**Domain:** Brownfield NestJS 11 + Prisma 6 e-commerce backend (bug fixes, missing features, security hardening, test coverage)
**Researched:** 2026-05-16
**Confidence:** HIGH (Prisma/NestJS docs verified) / MEDIUM (community patterns)

This document catalogues pitfalls specific to the five hardening domains for this milestone:

1. Stock management & order creation (Phase: Order)
2. Email transport (Phase: Auth/Email)
3. NestJS service unit testing (Phase: Tests, cross-cutting)
4. Token cleanup scheduler (Phase: Auth)
5. Payment method enum & validation (Phase: Payment)

---

## Critical Pitfalls

These cause data corruption, financial loss, or full-flow regressions. Address before merging.

### Pitfall 1: Stock decrement outside transaction — overselling

**Module:** `src/modules/order/order.service.ts` (createOrder)
**Phase:** Order hardening

**What goes wrong:** Two concurrent `POST /orders` requests for the same product both read `stock = 1`, both pass the `>= quantity` check, then both decrement. Final stock goes to `-1` and two customers are promised the same item.

**Why it happens:** Read-then-write pattern (`findUnique` → check → `update`) without atomic guarantees. Even inside `$transaction`, separate read + write statements at default isolation level (READ COMMITTED in Postgres) do not lock the row.

**Consequences:** Negative stock, dual-sold inventory, customer refunds, manual reconciliation, possible legal/refund exposure.

**Prevention (recommended pattern):**

```ts
// Inside prisma.$transaction (interactive)
const result = await tx.product.updateMany({
  where: { id: productId, stock: { gte: quantity }, deletedAt: null },
  data: { stock: { decrement: quantity } },
});
if (result.count === 0) {
  throw new BadRequestException(`Insufficient stock for product ${productId}`);
}
```

The `updateMany` with `stock: { gte: quantity }` is a single SQL `UPDATE ... WHERE stock >= ?` — atomic at the row level. If the condition fails, `count === 0` and we abort. No separate read needed.

**Warning signs to detect early:**

- Stock check pattern: `if (product.stock >= qty) { ... update(...) }` — always wrong
- Tests that decrement stock without simulating concurrency
- Logs showing stock going negative
- Order count for a product exceeds initial stock

**Test approach:** Spawn N concurrent `Promise.all([createOrder(), createOrder(), ...])` on a product with stock=1. Assert exactly one succeeds and stock lands at 0.

---

### Pitfall 2: Non-atomic order number generation with concurrent collisions

**Module:** `src/modules/order/order.service.ts` (line 30 — `ORD-${Date.now()}`)
**Phase:** Order hardening

**What goes wrong:** `Date.now()` has millisecond resolution. Two orders created in the same ms produce identical `orderNumber`, hitting the unique constraint → P2002 → 500 to user.

**Why it happens:** Wallclock-based IDs are not collision-free under any meaningful load.

**Consequences:** Random 500 errors that look intermittent; users blame "the server"; logs show P2002 without obvious cause.

**Prevention:** Use a non-time-only ID component.

- Quick fix: `ORD-${Date.now()}-${nanoid(6).toUpperCase()}` (install `nanoid`)
- Better: Postgres sequence (`CREATE SEQUENCE order_number_seq`) read via raw SQL in transaction
- Acceptable: `ORD-${ulid()}` — sortable, collision-resistant

**Warning signs:** Any `Date.now()` used as a unique identifier. P2002 errors in production logs on `Order.orderNumber`.

**Test approach:** Fire 50 concurrent `createOrder` calls in a Jest test using `Promise.all`. Assert all orderNumbers are unique.

---

### Pitfall 3: TOCTOU race in `getOrCreateCart` — duplicate cart attempts

**Module:** `src/modules/cart/cart.service.ts` (lines 69-73)
**Phase:** Cart (cleanup task)

**What goes wrong:** `findUnique` (no cart) → `create` is non-atomic. Two simultaneous requests for the same user both miss, both try to create, second fails with P2002 on `userId` unique constraint.

**Prevention:** Replace with `upsert`:

```ts
return this.prisma.cart.upsert({
  where: { userId },
  create: { userId },
  update: {},
  include: { items: { include: { product: true } } },
});
```

`upsert` translates to a single statement (Postgres `INSERT ... ON CONFLICT`).

**Warning signs:** "find then create" pattern on any unique-keyed model.

**Test approach:** Concurrent `Promise.all([getOrCreateCart(uid), getOrCreateCart(uid)])` for a brand-new user. Both must succeed; only one Cart row should exist.

---

### Pitfall 4: Payment method enum drift breaks existing rows

**Module:** `src/modules/payment/dto/create-payment.dto.ts`, schema migration
**Phase:** Payment hardening

**What goes wrong:** Switching `paymentMethod` from `String` to a TypeScript/Prisma enum without migrating existing rows means historical orders containing free-form values (e.g., `"paypal"`, `"hacked"`, `""`) fail to deserialize, break `GET /payments`, or cause Prisma client errors.

**Why it happens:** Restricting validation is a **backward-incompatible change** ([Zalando API guidelines](https://github.com/zalando/restful-api-guidelines/blob/main/chapters/compatibility.adoc)). Existing persisted data may not satisfy the new constraint.

**Consequences:** `findMany` returns rows that fail enum deserialization; Swagger contract changes silently; integration tests pass but `GET /payments?status=...` 500s in production.

**Prevention:**

1. Audit current data first: `SELECT DISTINCT "paymentMethod" FROM "Payment"`
2. Write a data migration that maps legacy values → new enum values (or `cod` as default) before adding the enum constraint
3. Use TypeScript enum + `@IsEnum(PaymentMethod)` in the DTO **before** converting Prisma `String` → enum
4. Add the Prisma `enum` in a separate migration that runs **after** data cleanup
5. Document the enum in OpenAPI with `@ApiProperty({ enum: PaymentMethod })` so contract is explicit

**Warning signs:**

- Enum added in DTO but Prisma column still `String` (silent inconsistency)
- Migration adds enum without data backfill
- No `SELECT DISTINCT` audit before the change

**Test approach:** Seed a payment with legacy value (`"unknown"`) and verify migration handles it gracefully before applying the enum.

---

### Pitfall 5: `FRONTEND_URL` validation gate without coordinated rollout

**Module:** `src/config/env.validation.ts`, `src/modules/auth/auth.service.ts`
**Phase:** Email/Auth hardening

**What goes wrong:** Adding `FRONTEND_URL: Joi.string().uri().required()` to validation causes the app to crash on startup if the env var is not set in Render. Deploy succeeds → container restart fails → service down.

**Prevention:**

- Set `FRONTEND_URL` in `render.yaml` and Render dashboard **before** merging the validation change
- Stage rollout: optional validation (`.optional()` with logged warning) in PR 1, switch to `.required()` in PR 2 after env var confirmed deployed
- Include `FRONTEND_URL` in startup log line so it's visible in deploy logs

**Warning signs:** Tightening env validation without updating `render.yaml` in the same PR.

---

## Moderate Pitfalls

These cause flakiness, test rot, or maintenance burden — but not data loss.

### Pitfall 6: Cron scheduler runs N times on N instances

**Module:** New `CleanupService` (to be added with `@nestjs/schedule`)
**Phase:** Auth — token cleanup task

**What goes wrong:** When Render scales the service to 2+ replicas, `@Cron('0 0 * * *')` fires on every instance simultaneously. Three concurrent `DELETE FROM token_blacklist WHERE expiresAt < NOW()` queries run; only one does meaningful work, the others contend for row locks. Mostly wasteful, but at scale can cause DB lock contention.

**Why it happens:** `@nestjs/schedule` is in-process — it has no awareness of other instances ([NestJS docs](https://docs.nestjs.com/techniques/task-scheduling)).

**Prevention (scoped to portfolio):**

- For this milestone (single-instance Render free tier): no special handling needed; document the constraint
- If scaling later: use Postgres advisory lock `SELECT pg_try_advisory_lock(<job_id>)` at the start of the cron handler; skip if not acquired
- Production-grade: BullMQ with Redis (out of scope per `PROJECT.md`)

**Warning signs:**

- Deploy config (`render.yaml`) sets `numInstances > 1` without locking strategy
- Cron handler writes to shared mutable state without idempotency guarantees

**Code guard pattern:**

```ts
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handleCleanup() {
  const [{ locked }] = await this.prisma.$queryRaw<[{ locked: boolean }]>`
    SELECT pg_try_advisory_lock(9876543210) AS locked
  `;
  if (!locked) { this.logger.log('Cleanup skipped — another instance is running'); return; }
  try {
    await this.tokenBlacklist.cleanupExpiredTokens();
    // ... other cleanups
  } finally {
    await this.prisma.$queryRaw`SELECT pg_advisory_unlock(9876543210)`;
  }
}
```

---

### Pitfall 7: Email transport configured without verifying SMTP at startup

**Module:** New `EmailService` (Phase: Email transport)
**Phase:** Auth email integration

**What goes wrong:** SMTP credentials are misconfigured (typo in `SMTP_HOST`, wrong port, blocked egress on Render). Registration succeeds but the email send silently fails (Nodemailer rejects, error logged, user never receives verification). Same symptom as the simulation it replaces.

**Why it happens:** `nodemailer.createTransport()` does not validate credentials lazily — only on first `sendMail`. By then it's deep inside a request handler.

**Prevention:**

- Call `transporter.verify()` in `onModuleInit()` of the `EmailService`; log success/failure with sanitized config (never log password)
- Wrap `sendMail` in try/catch; **do not** silently swallow errors — at minimum log with correlation ID
- Make failure to send an email a non-fatal-but-loud event (the auth flow should still succeed for user; ops should see the error)
- Add a `/health/email` check (admin only) that triggers a `verify()` on demand

**Warning signs:**

- No `verify()` call in `onModuleInit`
- Email send wrapped in `.catch(() => {})` with no logging
- No retry strategy for transient SMTP errors

**Test approach:** Mock the transporter to throw; assert that `registerUser` still returns success and the email failure is logged with user id + correlation id.

---

### Pitfall 8: Email templates hardcoded instead of file-based templates

**Module:** `EmailService` template rendering
**Phase:** Email transport

**What goes wrong:** Inline HTML strings in service code (`'<p>Hi ${name}</p>'`) lead to: (a) string-concat XSS (unescaped `name`), (b) impossible-to-preview templates, (c) no separation between content and code, (d) hard to test rendering separately from sending.

**Prevention:**

- Use `@nestjs-modules/mailer` with Handlebars/Pug adapter
- Store templates under `src/modules/auth/templates/*.hbs`
- Pass data as context object; let the template engine handle escaping
- Add a unit test that renders the template with sample data and asserts key strings appear (no real send)

**Warning signs:** Backtick template literals containing user-supplied values inside HTML in service methods.

---

### Pitfall 9: Tests over-mock Prisma — testing the mock, not the service

**Module:** All `*.service.spec.ts` files (Phase: Service unit tests)
**Phase:** Test coverage

**What goes wrong:** A service test mocks every `prisma.x.method` to return canned data, then asserts that the service called those methods. The test passes regardless of whether the service logic is correct. Refactoring the service's internal calls breaks tests without behavior changing — leading to "delete the test" or "update the mock" instead of investigating.

**Why it happens:** Easier to write `jest.fn().mockResolvedValue(...)` than to think about what behavior matters.

**Prevention:**

- Mock at the **boundary**: PrismaService and external services (email, payment gateway). Don't mock `OrderTransitionsUtil` — it's pure logic, use the real one.
- Assert on **return values and thrown exceptions**, not on mock call counts (unless the side-effect itself is the contract — e.g., "an email was sent")
- For business logic with branches (stock check, status transitions), write parameterized tests covering each branch's outcome
- Prefer `createMock<PrismaService>()` from `@golevelup/ts-jest` to avoid hand-typing every method
- Use `jest.spyOn(prisma.order, 'create').mockResolvedValueOnce(...)` over wholesale module replacement when only one call matters

**Warning signs:**

- Test bodies dominated by `expect(mockX).toHaveBeenCalledWith(...)` with no `expect(result).toEqual(...)`
- Mocks that return data identical to the data the test then asserts (tautology)
- Test fails after a service refactor that doesn't change observable behavior

**Code review heuristic:** If you can't break the service implementation while keeping all tests green, the tests aren't testing behavior.

---

### Pitfall 10: Async tests miss unhandled rejections / forget to `await`

**Module:** Service tests with promise chains
**Phase:** Test coverage

**What goes wrong:** A test like `service.create(badInput).catch(err => expect(err).toBeInstanceOf(BadRequestException))` without `await` or `return` — Jest finishes the test before the promise resolves; failures are invisible.

**Prevention:**

- Always use `await expect(...).rejects.toThrow(...)` pattern for async errors:
  ```ts
  await expect(service.create(badInput)).rejects.toThrow(BadRequestException);
  ```
- Enable ESLint `jest/valid-expect-in-promise` and `jest/no-conditional-expect`
- Configure Jest with `detectOpenHandles: true` in CI to catch dangling async ops

**Warning signs:** `.catch(err => expect(...))` not preceded by `await` or `return`. Tests that pass even when the assertion is wrong.

---

### Pitfall 11: `jest.clearAllMocks()` vs `jest.resetAllMocks()` confusion

**Module:** Service test setup
**Phase:** Test coverage

**What goes wrong:** Using `clearAllMocks` (clears call history only) when you needed `resetAllMocks` (clears history AND implementation). Mock setup from test 1 leaks into test 2; tests pass individually but fail in sequence (or vice versa).

**Prevention:**

- Use `afterEach(() => jest.restoreAllMocks())` for `spyOn`-based mocks
- Recreate the testing module in `beforeEach` rather than reusing across tests when state matters
- Add `resetMocks: true` in `jest.config.ts` to reset implementations before every test

**Warning signs:** Test order dependency — running a single test passes; running the file fails (or vice versa).

---

### Pitfall 12: Token cleanup migration drops rows without dry-run

**Module:** `CleanupService.cleanupExpiredTokens()`
**Phase:** Auth — scheduled cleanup

**What goes wrong:** First run after deploy deletes 100K accumulated stale rows; long-running `DELETE` locks the table; auth requests time out for several seconds; some users see 401s.

**Prevention:**

- Batch deletes: `DELETE FROM token_blacklist WHERE expiresAt < NOW() LIMIT 1000` in a loop with brief pauses
- Add an index on `expiresAt` (Prisma `@@index([expiresAt])`) so the predicate is index-scanned, not table-scanned
- For first cleanup after long accumulation: run manually off-hours, not via the scheduler's first auto-fire
- Log row count deleted per run; alert if it exceeds a threshold (signals a runaway producer)

**Warning signs:** No index on the timestamp column being filtered. Single `deleteMany` with no batch size.

---

## Minor Pitfalls

Lower severity — won't break production but cause code smell or developer friction.

### Pitfall 13: Cart `quantity=0` response ambiguity

**Module:** `cart.service.ts` `updateItemQuantity`
**Phase:** Cart hardening

**What goes wrong:** Returning `null` wrapped in the response envelope confuses clients — they don't know if the item was deleted or never existed.

**Prevention:** Return either a `204 No Content` (controller-level `@HttpCode(204)`) **or** an explicit `{ deleted: true, cartItemId }` envelope. Document in Swagger which one. Don't return naked `null`.

### Pitfall 14: Validation pipe `forbidNonWhitelisted` interacts badly with `PartialType`

**Module:** Update DTOs across modules
**Phase:** Cross-cutting (tests will surface this)

**What goes wrong:** When tests POST extra fields to update endpoints, the global `forbidNonWhitelisted: true` rejects with 400. Authors then add `@IsOptional()` decorators thinking it's a "missing field" — actually it's an "extra field" problem. Wastes debugging time.

**Prevention:** Document the global pipe config in CONTEXT.md or test setup notes. Add a helper `assertBadRequestExtraField()` test utility.

### Pitfall 15: Email tests that hit real SMTP in CI

**Module:** `EmailService` tests
**Phase:** Test coverage

**What goes wrong:** Test environment has `SMTP_HOST=smtp.gmail.com` set; tests actually send emails during CI runs; rate limits/blacklists kick in.

**Prevention:**

- Use `nodemailer-mock` or `MailerService` injection with a fake transport
- CI env config: `SMTP_HOST=localhost` and `SMTP_PORT=1025` for a fake `maildev` container if integration tests are needed
- Hard-fail any test that calls `transporter.sendMail` directly without the mock

### Pitfall 16: Swagger gating logic excludes test environments

**Module:** `src/main.ts` (Swagger gate)
**Phase:** Security hardening

**What goes wrong:** `if (NODE_ENV !== 'production') setupSwagger(...)` — but e2e tests run with `NODE_ENV=test`, so Swagger mounts during tests, adding setup time and potential mock noise.

**Prevention:** Use an explicit allowlist: `if (['development', 'staging'].includes(NODE_ENV))` rather than denylist.

### Pitfall 17: Globally applying `ThrottlerGuard` breaks tests that don't reset throttler state

**Module:** Global throttler activation
**Phase:** Security hardening

**What goes wrong:** Once `ThrottlerGuard` is applied as `APP_GUARD`, e2e tests that hit the same endpoint many times trip the limiter after request 11. Test fails for the wrong reason (429 instead of expected response).

**Prevention:**

- Use a higher limit in test env (`THROTTLE_LIMIT=1000`)
- Or override the guard in test modules: `.overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true })`
- Document the e2e setup that disables throttler

---

## Phase-Specific Warnings

| Phase Topic                 | Likely Pitfall                                 | Mitigation                                                     |
| --------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| Order — stock deduction     | Pitfall 1 (overselling)                        | Use `updateMany` with `stock: { gte: qty }` inside transaction |
| Order — orderNumber         | Pitfall 2 (collision)                          | nanoid suffix or DB sequence                                   |
| Order — pagination          | Inconsistent with `FindProductsQueryDto` shape | Extend `PaginationDto` (avoids drift cited in CONCERNS.md)     |
| Cart — quantity=0           | Pitfall 13 (null response)                     | 204 No Content or explicit `{ deleted: true }`                 |
| Cart — getOrCreate          | Pitfall 3 (TOCTOU)                             | `prisma.cart.upsert`                                           |
| Email — transport           | Pitfalls 7, 8, 15                              | `verify()` on init, file templates, mock transport in tests    |
| Email — env validation      | Pitfall 5 (rollout)                            | Stage env var, then validation                                 |
| Auth — token cleanup        | Pitfalls 6, 12                                 | Advisory lock guard + index on expiresAt + batched deletes     |
| Auth — change password      | (CONCERNS) sessions remain valid               | Call `revokeAllUserTokens` after hash update; integration test |
| Payment — enum              | Pitfall 4 (data drift)                         | Audit existing rows, backfill migration, then Prisma enum      |
| Tests — services            | Pitfalls 9, 10, 11                             | Mock at boundary, await rejections, reset mocks                |
| Security — Swagger gate     | Pitfall 16 (test env)                          | Allowlist environments                                         |
| Security — global throttler | Pitfall 17 (e2e tests)                         | Override guard in test module                                  |

---

## Detection Heuristics — Code Review Checklist

When reviewing PRs in this milestone, flag these patterns:

- [ ] Any `findUnique` followed by `update`/`create` on the same model — likely race condition
- [ ] `Date.now()` used as a unique identifier
- [ ] `Number(env.X) || default` — masks missing env var; should be Joi-validated
- [ ] Inline HTML in service files containing `${...}` user data
- [ ] `await` missing before `expect(...).rejects.toThrow(...)`
- [ ] Test asserts only `toHaveBeenCalledWith` without asserting return value or thrown error
- [ ] Prisma `String` column being typed as TS enum in DTO without migration
- [ ] `@Cron(...)` handler without idempotency or advisory lock when multi-instance is planned
- [ ] `.catch(() => {})` swallowing email/payment errors without logging
- [ ] New DTO that doesn't extend `PaginationDto` for list endpoints

---

## Sources

- [Prisma — Transactions and batch queries](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — atomic `updateMany`, interactive transactions, isolation levels (HIGH confidence)
- [Prisma — Race condition discussion](https://github.com/prisma/prisma/discussions/10709) — community pattern for read-then-update problem (MEDIUM)
- [Stop Passing the Hot Potato — Prisma Transactions in NestJS](https://masoudx.medium.com/stop-passing-the-hot-potato-managing-prisma-transactions-in-nestjs-8f30eeb5bb54) — transaction client propagation pattern (MEDIUM)
- [NestJS — Task Scheduling docs](https://docs.nestjs.com/techniques/task-scheduling) — `@nestjs/schedule` reference (HIGH)
- [Managing Cron Jobs with NestJS: Multi-Instance Issues and Locking](https://medium.com/@femresirvan/managing-cron-jobs-with-nestjs-solving-multi-instance-issues-and-locking-mechanisms-b2675d28a292) — duplicate execution problem and lock strategies (MEDIUM)
- [3 Ways to Run NestJS Cron Jobs with Multiple Instances](https://oliha.dev/articles/3-ways-to-run-nestjs-cron-jobs-when-running-multiple-instances/) — advisory locks, leader election, BullMQ (MEDIUM)
- [How to Send Emails With Nodemailer in NestJS](https://www.freecodecamp.org/news/how-to-use-nodemailer-in-nestjs/) — `@nestjs-modules/mailer` config patterns (MEDIUM)
- [@nestjs-modules/mailer on npm](https://www.npmjs.com/package/@nestjs-modules/mailer) — template adapter options, async config (HIGH)
- [nodemailer-mock](https://www.npmjs.com/package/nodemailer-mock) — testing pattern for mocking transport (MEDIUM)
- [Testing NestJS Apps: Best Practices & Common Pitfalls — Amplication](https://amplication.com/blog/best-practices-and-common-pitfalls-when-testing-my-nestjs-app) — over-mocking, testing private methods, configuration tests (MEDIUM)
- [Ultimate Guide: NestJS Unit Testing and Mocking](https://www.tomray.dev/nestjs-unit-testing) — TestingModule setup, mock patterns (MEDIUM)
- [Unit testing NestJS applications with Jest — LogRocket](https://blog.logrocket.com/unit-testing-nestjs-applications-with-jest/) — async patterns, `mockResolvedValue` (MEDIUM)
- [Zalando RESTful API Guidelines — Compatibility](https://github.com/zalando/restful-api-guidelines/blob/main/chapters/compatibility.adoc) — enum changes as breaking; never tighten validation (HIGH)
- [Google AIP-180 — Backwards compatibility](https://google.aip.dev/180) — enum addition/removal compatibility rules (HIGH)
- [OpenAPI Tools — Enum changes issue](https://github.com/OpenAPITools/openapi-diff/issues/303) — enum modification detection in API diffs (MEDIUM)

_Pitfalls compiled: 2026-05-16_
