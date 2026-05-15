# Technology Stack — Hardening Milestone

**Project:** E-Commerce API (NestJS 11 + Prisma 6 + PostgreSQL 16)
**Researched:** 2026-05-16
**Mode:** Ecosystem (subsequent milestone — additive choices only)
**Overall confidence:** HIGH

This milestone hardens an existing brownfield NestJS app. The core stack (NestJS, Prisma, PostgreSQL, JWT, Jest, supertest, class-validator) is fixed by constraint. This document is prescriptive about the additive choices required by the active requirements: **email transport**, **service-level unit tests**, **E2E tests**, and **Address API**.

---

## TL;DR — Prescriptive Picks

| Concern              | Pick                                                                                                                  | Version                      | Confidence |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------- |
| Email module         | `@nestjs-modules/mailer` + `nodemailer` + `handlebars`                                                                | `^2.0.2` / `^7.0.x` / `^4.x` | HIGH       |
| Dev email sink       | Mailtrap SMTP (sandbox inbox)                                                                                         | n/a                          | HIGH       |
| Prod email transport | Brevo SMTP (300/day free) OR Resend API (3000/mo, 100/day)                                                            | n/a                          | HIGH       |
| Prisma mocking       | `jest-mock-extended` `mockDeep<PrismaClient>()`                                                                       | `^4.0.0`                     | HIGH       |
| E2E rollback         | `@chax-at/transactional-prisma-testing`                                                                               | `^1.x`                       | MEDIUM     |
| E2E DB               | Same Postgres instance, separate schema/database per test run                                                         | n/a                          | HIGH       |
| App bootstrap reuse  | Extract `configureApp(app)` from `main.ts` so tests share global pipes/filters                                        | n/a                          | HIGH       |
| Address API pattern  | Owner-scoped CRUD, `isDefault: Boolean`, soft-delete via `deletedAt: DateTime?`, single transaction for "set default" | n/a                          | HIGH       |

No new framework, no ORM swap, no Redis. Everything below adds to the existing stack — nothing replaces it.

---

## 1. Email Transport

### Recommendation: `@nestjs-modules/mailer` with Nodemailer + Handlebars

```bash
npm install @nestjs-modules/mailer nodemailer handlebars
npm install -D @types/nodemailer
```

**Versions (May 2026):**

- `@nestjs-modules/mailer` `^2.0.2` — supports NestJS 11, latest as of May 2026
- `nodemailer` `^7.0.x`
- `handlebars` `^4.7.x`

**Rationale:**

1. **Transport-agnostic.** `@nestjs-modules/mailer` wraps Nodemailer, which supports SMTP out of the box. This means you write the email service **once** and switch between Mailtrap (dev), Brevo (prod), Resend SMTP, Gmail SMTP, or AWS SES by changing only env vars. No vendor lock-in — critical for a portfolio project that may switch providers.
2. **First-class NestJS integration.** `MailerModule.forRootAsync({ useFactory })` integrates cleanly with `ConfigService`. Pattern mirrors existing `JwtModule.registerAsync` in the codebase.
3. **Template support.** Handlebars templates (`.hbs`) with `inlineCssEnabled: true` produce client-safe HTML. Better than building raw HTML strings in TypeScript.
4. **Mature, current.** Active maintenance, NestJS 11 compatible, ~500k weekly downloads. No abandonment risk.
5. **Free at the SMTP layer.** The library itself is free; only the SMTP relay costs (and Mailtrap/Brevo free tiers cover dev + portfolio traffic).

**Module shape (target file: `src/modules/mail/mail.module.ts`):**

```typescript
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          port: config.get<number>('SMTP_PORT'),
          secure: config.get<number>('SMTP_PORT') === 465,
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASS'),
          },
        },
        defaults: { from: config.get('SMTP_FROM') },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

**Env vars to add to `src/config/env.validation.ts`:**

```typescript
SMTP_HOST: Joi.string().required(),
SMTP_PORT: Joi.number().valid(25, 465, 587, 2525).required(),
SMTP_USER: Joi.string().required(),
SMTP_PASS: Joi.string().required(),
SMTP_FROM: Joi.string().email().required(),
FRONTEND_URL: Joi.string().uri().required(),  // also addresses existing concern
```

### Provider Choice Matrix

| Provider               | Free Tier (May 2026)                           | NestJS Fit         | When to Use                                                                                                 |
| ---------------------- | ---------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Mailtrap Sandbox**   | Unlimited test emails, capped 150/day delivery | SMTP — works as-is | **Dev / staging.** Catches emails in a UI inbox, never sends to real users. Mandatory for safe development. |
| **Brevo SMTP**         | 300/day forever, no card required              | SMTP — works as-is | **Recommended production default.** Highest daily cap free, no daily-burst trap, NestJS-friendly SMTP.      |
| **Resend (SMTP mode)** | 3000/mo, 100/day, 1 domain                     | SMTP — works as-is | Good DX, modern dashboard, but 100/day hard cap can bite. Choose if you want the polished dashboard.        |
| **Gmail SMTP**         | ~500/day personal account                      | SMTP — works       | **Do not use in production.** ToS violations for bulk; OK for solo dev testing only.                        |

**Anti-recommendations:**

- **SendGrid** — Killed its free tier (now a 60-day trial only, then $19.95/mo). Avoid for a portfolio project. (HIGH confidence)
- **Resend SDK direct (`resend` npm package)** — Locks you into one vendor. The mailer-module + SMTP approach gives you the same Resend deliverability while keeping the code provider-neutral. Only adopt the SDK if you specifically need React Email components (not the case here — Handlebars is sufficient for verification + password-reset).
- **AWS SES** — Requires production approval (out-of-sandbox application), overhead unjustified at portfolio scale.
- **Building your own SMTP client over raw `nodemailer`** — Reimplementing `@nestjs-modules/mailer`'s DI wiring and template handling. No upside.

### Template Engine: Handlebars (not Pug/EJS/MJML)

- **Handlebars** — pick this. Logic-less syntax matches the small surface of transactional emails (verify, reset, order-confirmation). Inline CSS via `inlineCssEnabled`. Familiar to most devs.
- **MJML** — overkill for 3–5 transactional templates. Adds a build step.
- **Pug/EJS** — works, but Handlebars has the most examples in `@nestjs-modules/mailer` docs.

Template directory: `src/modules/mail/templates/*.hbs`. Compile-time copy via `nest-cli.json` `assets` entry.

### Sources

- [@nestjs-modules/mailer on npm](https://www.npmjs.com/package/@nestjs-modules/mailer)
- [Mailer module docs](https://nest-modules.github.io/mailer/) — HIGH (official)
- [Resend pricing May 2026](https://resend.com/pricing) — HIGH
- [Resend account quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits) — HIGH
- [Brevo free plan limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan) — HIGH
- [Resend vs SendGrid 2026 (SendGrid killed free tier)](https://dev.to/thiago_alvarez_a7561753aa/resend-vs-sendgrid-2026-sendgrid-killed-its-free-tier-now-what-2gh4) — MEDIUM
- [Email API comparison 2026](https://blog.vibecoder.me/email-service-pricing-resend-sendgrid-postmark) — MEDIUM

---

## 2. Service Unit Testing — Prisma & JWT Mocking

### Recommendation: `jest-mock-extended` with `mockDeep<PrismaClient>()`

```bash
npm install -D jest-mock-extended
```

**Version:** `jest-mock-extended` `^4.0.0` (May 2026, Jest 29 compatible).

**Rationale:**

1. **Officially recommended by Prisma docs.** The Prisma unit-testing guide uses this exact library. (HIGH confidence — official source.)
2. **Type-safe deep mocking.** `mockDeep<PrismaClient>()` produces a `DeepMockProxy` where every nested method (`prisma.user.findUnique`, `prisma.$transaction`, etc.) is a `jest.Mock` automatically. No hand-written nested mock objects (which the existing `TESTING.md` shows as the current expected pattern — that approach scales poorly across 8 services).
3. **Compatible with `Test.createTestingModule().overrideProvider(PrismaService).useValue(mockDeep<PrismaClient>())`.** This is the NestJS-idiomatic injection point. Matches the existing `app.controller.spec.ts` pattern.
4. **Resets cleanly per test** via `mockReset(prismaMock)` in `beforeEach`.

**Canonical pattern (target: every `*.service.spec.ts`):**

```typescript
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockDeep<PrismaClient>() }],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => mockReset(prisma));

  it('throws NotFoundException when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
  });
});
```

### JwtService and ConfigService Mocking

- **`JwtService`** — mock with `useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() }`. Do **not** import the real `JwtModule` in service unit tests (it requires secrets, slowing tests and coupling them to env).
- **`ConfigService`** — mock with `useValue: { get: jest.fn((key) => testConfig[key]) }`. Use a small in-test config map keyed by env var name.
- **`PasswordService`** — for AuthService tests, mock it (`hash`, `compare`). It has its own pure-function tests already (and bcrypt is slow — mocking saves real seconds across the suite).
- **`MailService`** — once implemented, mock the `send*` methods. Never hit a real SMTP server from unit tests.

### `$transaction` Pattern

Prisma services use `prisma.$transaction(async (tx) => ...)`. With `mockDeep`:

```typescript
prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
```

This passes the same mocked `prisma` instance as the transaction client `tx`, so inner calls like `tx.product.updateMany` route through the same mock surface. Critical for testing `OrderService.create` (stock decrement) and `AuthService.login` (refresh token rotation).

### What NOT to do

- **Do not** hand-roll `mockPrismaService = { user: { findUnique: jest.fn() } }` per file. It does not scale across 8 services, and TypeScript will not catch typos in Prisma model names.
- **Do not** instantiate a real `PrismaClient` in unit tests — that hits the dev DB and makes tests slow + flaky. Save that for E2E.
- **Do not** use `jest.mock('@prisma/client')` at the module level. It bypasses NestJS DI and makes the test brittle to refactors.

### Sources

- [Prisma unit testing guide (official)](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing) — HIGH
- [Prisma unit testing discussion #7084](https://github.com/prisma/prisma/discussions/7084) — HIGH
- [NestJS Testing Recipe: Mocking Prisma](https://medium.com/@bonaventuragal/nestjs-testing-recipe-mocking-prisma-274c212d4b80) — MEDIUM

---

## 3. E2E Testing — Test Database & Rollback

### Recommendation

1. **Use a dedicated test database** — separate Postgres database name (e.g. `ecommerce_test`) or schema. Same instance as dev is fine; the existing `docker-compose.yml` Postgres works.
2. **Wrap each test in a transaction that rolls back** — `@chax-at/transactional-prisma-testing` proxies `PrismaService` so every test runs inside a transaction that is rolled back in `afterEach`.
3. **Extract bootstrap to `configureApp(app)` in `src/main.ts`** so E2E tests apply the same global `ValidationPipe`, filters, prefix, and interceptors as production. This addresses the well-known NestJS pitfall where global pipes set inside `bootstrap()` are missing in E2E tests.
4. **Use real `JwtModule`** in E2E (not mocked) — guards, strategies, and token rotation must execute end-to-end. Set `JWT_SECRET` from `.env.test`.

```bash
npm install -D @chax-at/transactional-prisma-testing
```

**Version:** `@chax-at/transactional-prisma-testing` `^1.x` (latest stable as of May 2026).

**Rationale:**

1. **Transactional rollback is 10–100× faster than truncate-and-reseed.** Each test starts in a fresh transaction; rollback in `afterEach` resets DB state in milliseconds. Truncating tables across a multi-table schema (User, Address, Cart, CartItem, Order, OrderItem, Payment, RefreshToken, etc.) per test would take seconds and create order-dependent flakiness.
2. **No test ordering dependencies.** Every test sees a clean DB even when run in parallel files (Jest `--maxWorkers`).
3. **The library proxies `PrismaService`** — your services see a normal `PrismaService` interface. No production code changes.

**Setup file (`test/setup-e2e.ts`):**

```typescript
import { PrismaTestingHelper } from '@chax-at/transactional-prisma-testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main'; // extract from bootstrap()

let app: INestApplication;
let prismaHelper: PrismaTestingHelper<PrismaService>;

beforeAll(async () => {
  const realPrisma = new PrismaService();
  await realPrisma.$connect();
  prismaHelper = new PrismaTestingHelper(realPrisma);

  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prismaHelper.getProxyClient())
    .compile();

  app = module.createNestApplication();
  configureApp(app);
  await app.init();
});

beforeEach(() => prismaHelper.startNewTransaction());
afterEach(() => prismaHelper.rollbackCurrentTransaction());
afterAll(() => app.close());
```

### Test Database Provisioning

- **Local:** point `DATABASE_URL` in `.env.test` to a separate DB on the same Docker Postgres (`postgresql://...:5432/ecommerce_test?schema=public`).
- **CI:** spin up a Postgres service container in GitHub Actions, run `prisma migrate deploy` once, then run E2E suite.
- **Migrations:** apply once per CI run via `prisma migrate deploy` before tests. The transactional rollback handles per-test state.
- **Seeding:** seed shared lookup data (e.g., default category) **outside** the rollback boundary — i.e., before `prismaHelper.startNewTransaction()` is wired in, using the real `PrismaService` directly. Per-test fixtures go inside the transaction.

### What NOT to use

- **`@nestjs-cls/transactional`** — Excellent library for cross-service transaction propagation in production code, but heavyweight for E2E rollback alone. Adopt only if you need decorator-driven service-layer transactions.
- **Testcontainers (`@testcontainers/postgresql`)** — Provides hermetic per-suite Postgres in Docker. Good but slower (~5s startup per suite) and requires Docker in CI. Defer unless tests prove flaky in shared-DB mode.
- **SQLite-in-memory** — Prisma supports it, but PostgreSQL-specific features (citext, JSONB operators, partial indexes, `$queryRaw`) will diverge. Do not use — you need fidelity with prod Postgres.
- **Manual `BEGIN`/`ROLLBACK` in raw SQL** — fragile, doesn't compose with Prisma's connection pool.

### Auth in E2E

- **Do not override `JwtAuthGuard`.** Real login flow must work end-to-end (it's listed as a target flow in `PROJECT.md`).
- **Helper:** `loginAsUser(email, password)` → returns access token; reuse across tests via a small `test/helpers/auth.ts`.
- **Optional `.overrideGuard`** only for tests targeting non-auth controllers where seeded users are inconvenient.

### Known caveats (from library docs)

- Prisma Fluent API is unsupported under the proxy — affects nested writes via relation traversal. Use `connect` / `create` semantics instead.
- Auto-increment sequences are **not** reset on rollback. Don't assert on specific IDs across tests.
- `@default(now())` returns the transaction start timestamp — all `createdAt` in one test will be equal. Don't assert microsecond ordering.

### Sources

- [@chax-at/transactional-prisma-testing on npm](https://www.npmjs.com/package/@chax-at/transactional-prisma-testing) — HIGH
- [NestJS + Prisma transaction propagation & test rollback](https://dev.to/callgent/nestjs-prisma-transaction-propagation-test-rollback-multi-tenancy-4485) — MEDIUM
- [NestJS issue #1843 — Rollback database in E2E tests](https://github.com/nestjs/nest/issues/1843) — HIGH
- [Global ValidationPipe in E2E pitfall (NestJS docs #2174)](https://github.com/nestjs/docs.nestjs.com/issues/2174) — HIGH
- [Improving E2E with Testcontainers (alternative)](https://dev.to/medaymentn/improving-intergratione2e-testing-using-nestjs-and-testcontainers-3eh0) — MEDIUM

---

## 4. Address Management API

### Recommendation

No new dependency. Build the module using existing stack (NestJS controllers, Prisma, class-validator). The Prisma `Address` model already exists in `prisma/schema.prisma` (lines 104–122).

**Required schema additions (Prisma migration):**

```prisma
model Address {
  id         Int       @id @default(autoincrement())
  userId     Int
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... existing fields (recipientName, phone, line1, line2, city, state, postalCode, country, ...)
  isDefault  Boolean   @default(false)
  deletedAt  DateTime?  // NEW — soft delete

  @@index([userId, deletedAt])
  @@index([userId, isDefault])     // NEW — fast default lookup
}
```

### API Surface

| Method   | Path                              | Auth | Behavior                                                                                                       |
| -------- | --------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/users/me/addresses`             | user | List own addresses, exclude soft-deleted, default first                                                        |
| `GET`    | `/users/me/addresses/:id`         | user | Owner-scoped fetch; 404 if not owner or soft-deleted                                                           |
| `POST`   | `/users/me/addresses`             | user | Create. If first address OR `isDefault: true`, mark as default (unset others in transaction)                   |
| `PATCH`  | `/users/me/addresses/:id`         | user | Update. If `isDefault: true`, unset others                                                                     |
| `PATCH`  | `/users/me/addresses/:id/default` | user | Dedicated "set default" endpoint; clearer than overloading PATCH                                               |
| `DELETE` | `/users/me/addresses/:id`         | user | Soft-delete (`deletedAt = now()`). If was default and another address exists, promote oldest active to default |

**Design rationale:**

1. **Owner-scoped routing under `/users/me/...`** — Pattern already used implicitly by JWT user identification. Matches REST conventions for "my resources" and avoids the security trap of `/addresses/:id` where any user could attempt to fetch any address.
2. **Single default invariant enforced in a transaction.** "Set default" is **two writes** — unset all `isDefault` for the user, then set the target. Must be atomic; do it in `prisma.$transaction([...])`. Without a transaction, a crash mid-write leaves the user with zero defaults or two defaults.
3. **`isDefault: Boolean` (not a separate `defaultAddressId` on User).** Putting the flag on the address row keeps the data normalized — one source of truth, no FK back-pointer to maintain. Avoids the dual-write problem when deleting an address.
4. **Soft-delete via `deletedAt: DateTime?`.** Matches the existing soft-delete pattern in the codebase (Users, Products use the same approach). Critical for orders: an Order references an Address snapshot — hard-deleting would orphan order history. Future Order refactor (`shippingAddressId` → `Address`) depends on this.
5. **Default-promotion on delete.** If the soft-deleted address was default and other active addresses exist, promote the oldest remaining one. Prevents the "no default" state, simplifies frontend (always one default to show at checkout).
6. **Dedicated `/default` endpoint** — `PATCH /addresses/:id/default` is more discoverable in Swagger than overloading the generic PATCH and helps with role-scoped permissions later.

### Anti-Patterns to Avoid

- **Storing `defaultAddressId` on User and `isDefault` on Address** — dual writes, drift risk. Pick one. Address-side wins because of soft-delete + Order snapshot needs.
- **Hard delete.** Breaks order history. Existing schema's `onDelete: Cascade` will silently nuke orders' shipping references. Soft delete + Order snapshot decouples the two.
- **Allowing multiple `isDefault: true` simultaneously.** Enforce in service code (transaction) AND optionally add a partial unique index `CREATE UNIQUE INDEX ON address (userId) WHERE isDefault = true AND deletedAt IS NULL` — Prisma 6 supports raw migration SQL for this. (MEDIUM confidence — verify Prisma migration syntax for partial unique indexes against your Postgres 16.)
- **Embedding the full address JSON in Order.** The existing order flow takes `shippingAddress` as freeform JSON (per `CONCERNS.md`). Migrate Order to store **both** an `addressId` reference (audit trail) **and** a denormalized snapshot of fields at time of order (`shippingRecipient`, `shippingLine1`, etc.) — so editing or deleting the address later doesn't rewrite history.

### Validation (class-validator on DTOs)

Already in stack. Use:

- `@IsString() @MinLength(2) @MaxLength(100)` for line1/city/recipient
- `@IsOptional() @IsString()` for line2/state
- `@Matches(/^[A-Z]{2}$/)` for country (ISO 3166-1 alpha-2)
- `@Matches(/^\+?[0-9\s\-()]{7,20}$/)` for phone — loose international format
- `@IsBoolean() @IsOptional()` for `isDefault` on create/update DTOs

### Sources

- [REST API deletion patterns](https://medium.com/biodati/rest-api-deletion-pattern-4eb8b0dafbce) — MEDIUM
- [Soft deletion (API Design Patterns ch. 25)](https://livebook.manning.com/book/api-design-patterns/chapter-25/v-7/) — MEDIUM
- [AIP-135 standard delete method (Google API design)](https://google.aip.dev/135) — HIGH
- Pattern derived from existing codebase soft-delete conventions (Users, Products) — HIGH (codebase evidence)

---

## Installation Summary

```bash
# Email
npm install @nestjs-modules/mailer nodemailer handlebars
npm install -D @types/nodemailer

# Testing
npm install -D jest-mock-extended @chax-at/transactional-prisma-testing
```

**No dev dependencies removed.** Existing `jest`, `ts-jest`, `supertest`, `@nestjs/testing` versions are current and sufficient.

---

## Alternatives Considered (Recap)

| Concern         | Recommended                     | Alternative                   | Why Not                                                                         |
| --------------- | ------------------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| Email module    | `@nestjs-modules/mailer`        | `resend` SDK directly         | Locks to single vendor; SMTP layer gives same deliverability with portable code |
| Email module    | `@nestjs-modules/mailer`        | Custom Nodemailer wrapper     | Reinventing DI, templates, async config                                         |
| Email provider  | Brevo SMTP / Mailtrap           | SendGrid                      | Killed its free tier (60-day trial only) in 2025–2026                           |
| Email provider  | Brevo SMTP / Mailtrap           | AWS SES                       | Sandbox approval friction; overkill for portfolio                               |
| Template engine | Handlebars                      | MJML                          | Build-step overhead for 3–5 templates                                           |
| Prisma mocking  | `jest-mock-extended` `mockDeep` | Hand-written mock objects     | Doesn't scale across 8 services; loses type safety                              |
| Prisma mocking  | `jest-mock-extended`            | `jest.mock('@prisma/client')` | Bypasses NestJS DI; brittle to refactor                                         |
| E2E DB strategy | Transactional rollback          | Truncate + reseed per test    | 10–100× slower; ordering flakiness                                              |
| E2E DB strategy | Transactional rollback          | Testcontainers                | Slower startup, Docker-in-CI overhead, not needed at this scale                 |
| E2E DB strategy | Transactional rollback          | SQLite in-memory              | PostgreSQL feature divergence (JSONB, citext, partial indexes)                  |
| Address default | `isDefault` on Address          | `defaultAddressId` on User    | Dual-write drift; conflicts with soft-delete + Order snapshot                   |
| Address delete  | Soft delete                     | Hard delete                   | Cascades to Orders — destroys history                                           |

---

## Confidence Assessment

| Recommendation                                               | Confidence | Verification                                                                          |
| ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------- |
| `@nestjs-modules/mailer` + Nodemailer + Handlebars           | HIGH       | Context7 (official), npm, NestJS 11 compatibility verified                            |
| Mailtrap (dev) + Brevo (prod) as free SMTP                   | HIGH       | Official pricing pages (May 2026)                                                     |
| Avoid SendGrid free tier                                     | HIGH       | Multiple 2026 sources confirm free tier removal                                       |
| `jest-mock-extended` `mockDeep<PrismaClient>()`              | HIGH       | Official Prisma docs recommend this exact library                                     |
| `Test.createTestingModule().overrideProvider(PrismaService)` | HIGH       | NestJS official testing pattern                                                       |
| `@chax-at/transactional-prisma-testing`                      | MEDIUM     | Single maintainer library; mature (1.x); active issues acceptable for portfolio scale |
| Extract `configureApp(app)` from `main.ts`                   | HIGH       | Documented NestJS pitfall (`nestjs/docs.nestjs.com#2174`)                             |
| Address default flag on Address row                          | HIGH       | Standard e-commerce pattern; aligns with existing soft-delete convention in codebase  |
| Soft-delete default-promotion logic                          | HIGH       | Derived from existing codebase conventions + REST design patterns                     |
| Partial unique index for `isDefault`                         | MEDIUM     | Prisma 6 supports raw SQL migrations; verify exact syntax at implementation time      |

---

_Stack research: 2026-05-16_
