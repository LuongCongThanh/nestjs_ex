# Architecture Patterns — Hardening Milestone

**Domain:** NestJS 11 + Prisma 6 + PostgreSQL e-commerce monolith (brownfield hardening)
**Researched:** 2026-05-16
**Confidence:** HIGH (NestJS schedule/throttler via Context7; Prisma types via official docs; module patterns verified against existing codebase)

---

## 1. Recommended Architecture (post-hardening)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    main.ts (Bootstrap)                                    │
│   Helmet • CORS • Swagger(prod-gated) • Global Pipes/Filters             │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────────┐
│                  AppModule  src/app.module.ts                             │
│  CorrelationIdMiddleware                                                  │
│  ThrottlerModule.forRoot([...])  ← config only                            │
│  ScheduleModule.forRoot()        ← NEW (cron jobs)                        │
│  providers:                                                               │
│    { provide: APP_GUARD, useClass: ThrottlerGuard }   ← NEW (global)      │
│    { provide: APP_INTERCEPTOR, useClass: Transform... } (existing)        │
├──────┬────────┬────────┬────────┬──────┬───────┬────────┬────────┬──────┤
│ auth │ users  │categ.  │products│ cart │ order │ payment│ address│tasks │
│      │        │        │        │      │       │        │ (NEW)  │(NEW) │
└──────┴────────┴────────┴────────┴──────┴───┬───┴────────┴───┬────┴──┬───┘
                                              │                │       │
                                              │ uses           │ uses  │ cron
                                              ▼                ▼       │
                                       ┌────────────────────────┐      │
                                       │ AddressService (NEW)   │◄─────┘
                                       │ - getById(userId, id)  │  TasksService
                                       │ - getDefault(userId)   │  cleans
                                       │ - snapshot(addr) → JSON│  blacklist/refresh/
                                       └───────────┬────────────┘  email-verif tables
                                                   │
                          ┌────────────────────────▼─────────────────────┐
                          │       PrismaService (singleton)               │
                          └────────────────────────┬─────────────────────┘
                                                   │
                                       PostgreSQL (Neon)
```

**Key changes vs current architecture:**

1. `APP_GUARD` provider replaces `@UseGuards(ThrottlerGuard)` on `AuthController` — rate limit becomes truly global.
2. New `ScheduleModule.forRoot()` in `AppModule` enables `@Cron` in a new `TasksModule`.
3. New `AddressModule` exports `AddressService` — imported by `OrderModule` so order creation can resolve an `addressId` to a snapshot.
4. No repository layer introduced (per `PROJECT.md` decision). Instead: typed `Prisma.*GetPayload<...>` projection types replace `as any` casts inline in services.

---

## 2. Address Module — Component Boundaries

### 2.1 File layout

```
src/modules/address/
├── address.module.ts
├── address.controller.ts
├── address.service.ts
├── dto/
│   ├── create-address.dto.ts
│   ├── update-address.dto.ts        // extends PartialType(CreateAddressDto)
│   └── address.response.dto.ts      // for Swagger response shape
├── types/
│   └── address-select.ts            // shared Prisma.AddressGetPayload<...> type
└── address.service.spec.ts          // co-located unit test
```

### 2.2 Module wiring

```typescript
// address.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService], // ← MUST export — Order needs it
})
export class AddressModule {}
```

### 2.3 Domain model (already exists in schema)

The `Address` table is already defined in `prisma/schema.prisma:104-122`:

| Field        | Type     | Notes                            |
| ------------ | -------- | -------------------------------- |
| `id`         | uuid PK  |                                  |
| `userId`     | uuid FK  | `onDelete: Cascade` from User    |
| `fullName`   | String   |                                  |
| `phone`      | String   |                                  |
| `address`    | String   | street line                      |
| `ward`       | String?  | VN administrative                |
| `district`   | String?  | VN administrative                |
| `city`       | String   |                                  |
| `country`    | String   |                                  |
| `postalCode` | String?  |                                  |
| `isDefault`  | Boolean  | only one per user should be true |
| timestamps   | DateTime |                                  |

**No migration required** — only application-layer work.

### 2.4 REST surface

| Method | Path                            | Auth       | Purpose                                  |
| ------ | ------------------------------- | ---------- | ---------------------------------------- |
| GET    | `/api/v1/addresses`             | user       | List my addresses                        |
| GET    | `/api/v1/addresses/:id`         | user (own) | Get one (404 if not mine)                |
| POST   | `/api/v1/addresses`             | user       | Create — if `isDefault`, unset others    |
| PATCH  | `/api/v1/addresses/:id`         | user (own) | Partial update                           |
| DELETE | `/api/v1/addresses/:id`         | user (own) | Delete (hard — addresses aren't audited) |
| PATCH  | `/api/v1/addresses/:id/default` | user (own) | Promote to default                       |

Admin/staff do **not** need read access to user addresses (PII). Keep it user-scoped.

### 2.5 Authorization rule (enforced inside service)

Every read/write must filter by `userId` from the JWT — never trust an `:id` alone:

```typescript
await this.prisma.address.findFirst({
  where: { id, userId }, // composite — prevents IDOR
  select: addressSelect,
});
```

This is the same pattern used in `CartService` and avoids needing a custom guard.

### 2.6 `isDefault` invariant

Only one address per user may have `isDefault = true`. Enforce in service inside a transaction:

```typescript
async setDefault(userId: string, addressId: string) {
  await this.prisma.$transaction([
    this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    this.prisma.address.update({
      where: { id: addressId },        // also verify ownership before this call
      data: { isDefault: true },
    }),
  ]);
}
```

Same logic runs at create-time when `dto.isDefault === true`.

---

## 3. Order Integration Points

`Order.shippingAddressSnapshot` is already declared as `Json` (`schema.prisma:160`). This is intentional — it preserves the address as it was at order time, so subsequent address edits/deletes don't mutate historical orders. **Keep this design.**

### 3.1 New order-creation contract

```typescript
// dto/create-order.dto.ts
export class CreateOrderDto {
  @IsUUID()
  addressId!: string; // ← references saved address (new)

  @IsOptional()
  @IsString()
  notes?: string;

  // remove the old free-form shippingAddress payload
}
```

### 3.2 Flow inside `OrderService.createOrder()`

```typescript
// 1. Resolve address (ownership-checked)
const address = await this.addressService.findOneForUser(userId, dto.addressId);
if (!address) throw new NotFoundException('Address not found');

// 2. Build immutable snapshot
const snapshot = this.addressService.toSnapshot(address);
// returns { fullName, phone, address, ward, district, city, country, postalCode }
// — explicitly omits id, userId, isDefault, timestamps

// 3. Inside existing $transaction:
const order = await tx.order.create({
  data: {
    ...,
    shippingAddressSnapshot: snapshot,  // Prisma serializes to JSONB
  },
});
```

### 3.3 Coupling

```
OrderModule
  imports: [PrismaModule, CartModule, AddressModule]   // ← add AddressModule
```

No circular import: `AddressModule` does **not** import `OrderModule`. The dependency arrow is `Order → Address`.

### 3.4 Why a snapshot, not a foreign key

- A user deletes an old address → historical orders must still show the original shipping address.
- A user edits an address (typo fix) → in-flight orders should not silently change destinations.
- This matches industry practice (Shopify, WooCommerce both snapshot).

---

## 4. Scheduled Cleanup Job (TasksModule)

### 4.1 Install

```bash
npm install @nestjs/schedule
```

`@nestjs/schedule` is the official NestJS package — uses `cron` under the hood, zero extra deps relative to what's already in the tree.

### 4.2 Wiring

```typescript
// app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ← enables @Cron discovery
    // ...existing imports
    TasksModule, // ← new
  ],
})
export class AppModule {}
```

### 4.3 TasksModule

```
src/modules/tasks/
├── tasks.module.ts
├── tasks.service.ts
└── tasks.service.spec.ts
```

```typescript
// tasks.module.ts
@Module({
  imports: [AuthModule], // to inject the three cleanup services
  providers: [TasksService],
})
export class TasksModule {}
```

`AuthModule` must `export` the three services it currently keeps private:
`TokenBlacklistService`, `RefreshTokenService`, `EmailVerificationService`.

### 4.4 TasksService — canonical pattern

```typescript
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly emailVerif: EmailVerificationService,
  ) {}

  // Runs at 00:00 server time, every day.
  // waitForCompletion prevents overlap if cleanup takes >24h (it won't, but safety).
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'cleanup-expired-tokens',
    waitForCompletion: true,
  })
  async cleanupExpiredTokens() {
    this.logger.log('Starting daily token cleanup');
    const [blacklist, refresh, emailVerif] = await Promise.allSettled([
      this.tokenBlacklist.cleanupExpiredTokens(),
      this.refreshTokens.cleanupExpiredTokens(),
      this.emailVerif.cleanupExpiredTokens(),
    ]);

    for (const [name, r] of [
      ['blacklist', blacklist],
      ['refresh', refresh],
      ['emailVerif', emailVerif],
    ] as const) {
      if (r.status === 'rejected') {
        this.logger.error(`Cleanup ${name} failed`, r.reason);
      } else {
        this.logger.log(`Cleanup ${name} OK (deleted=${r.value ?? 'n/a'})`);
      }
    }
  }
}
```

**Why these decorator options:**

- `CronExpression.EVERY_DAY_AT_MIDNIGHT` — predefined enum, avoids hand-rolling `'0 0 * * *'` typos (verified via Context7 `/nestjs/schedule`).
- `waitForCompletion: true` — guarantees no overlap if a previous run is still going. Verified in current `@nestjs/schedule` docs.
- `name` — required for programmatic stop/start via `SchedulerRegistry` and shows up in Nest logs.
- `Promise.allSettled` — one cleanup failing must not block the others.

### 4.5 Render deployment caveat

Render free-tier web services sleep after 15 min of inactivity. The cron only fires while the process is running, so `EVERY_DAY_AT_MIDNIGHT` may be missed entirely on sleepy instances. For portfolio scope this is acceptable; document it. If guaranteed execution is required later, move cleanup to a Render Cron Job (separate paid service) or a Postgres `pg_cron` extension. **Confidence MEDIUM** — based on Render's documented free-tier sleep behavior, not directly tested here.

---

## 5. Global Rate Limiting — APP_GUARD Pattern

### 5.1 Verdict

Use `APP_GUARD` (DI-friendly) **not** `app.useGlobalGuards()` in `main.ts`. Reason: `APP_GUARD` lets Nest construct the guard through the DI container so it can inject `ThrottlerStorage` and `Reflector`; `useGlobalGuards()` requires a hand-instantiated guard and won't resolve dependencies. This is the recommended pattern in `@nestjs/throttler` README (HIGH confidence — Context7 `/nestjs/throttler`).

### 5.2 AppModule

```typescript
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, seconds, minutes } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: seconds(1), limit: 3 }, // burst
      { name: 'medium', ttl: seconds(10), limit: 20 },
      { name: 'long', ttl: minutes(1), limit: 100 }, // sustained
    ]),
    // ...existing
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // ← NEW
    // ...existing global interceptors
  ],
})
export class AppModule {}
```

### 5.3 Remove old per-controller guard

Delete `@UseGuards(ThrottlerGuard)` from `AuthController` — it becomes redundant once global. Keep `@Throttle({ short: { limit: 3, ttl: seconds(60) } })` overrides if you want **tighter** limits on `/auth/login` and `/auth/forgot-password`. Use `@SkipThrottle()` on `/health`.

### 5.4 Proxy/IP caveat (Render)

Render terminates TLS at a proxy. By default `ThrottlerGuard.getTracker()` uses `req.ip`, which resolves to the proxy IP — meaning **every client looks like the same client** and rate limits will fire for innocent users.

Fix:

```typescript
// main.ts (before app.listen)
app.set('trust proxy', 1);
```

And optionally subclass:

```typescript
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips?.length ? req.ips[0] : req.ip;
  }
}
// then provide ThrottlerBehindProxyGuard instead of ThrottlerGuard
```

This pattern is documented in `/nestjs/throttler` Context7 docs (HIGH confidence).

### 5.5 In-memory storage is acceptable

`PROJECT.md` explicitly defers Redis. Default in-memory throttler storage works for single-instance Render. Document the horizontal-scaling caveat in a comment near `ThrottlerModule.forRoot`.

---

## 6. Type-Safe Prisma Projections (replacing `as any`)

### 6.1 Problem (from CONCERNS.md)

`users.service.ts` lines 36, 108, 118, 131, 156 and `categories.service.ts` lines 141, 165 use `as any` / `as unknown as User` casts because the `select` projection drops fields like `password`, but service signatures return the broad `User` type.

### 6.2 Canonical fix — `Prisma.UserGetPayload<...>` pattern

**Step 1 — Define the select once, as a `const`:**

```typescript
// modules/users/types/user-select.ts
import { Prisma } from '@prisma/client';

export const userSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
  // NOTE: deliberately omits password, deletedAt
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;
```

**Step 2 — Use it everywhere:**

```typescript
async findById(id: string): Promise<SafeUser | null> {
  return this.prisma.user.findUnique({
    where: { id },
    select: userSelect,        // ← TS infers the exact return shape
  });
  // no cast needed
}
```

### 6.3 Why this works

- `satisfies Prisma.UserSelect` validates the literal against Prisma's generated type without widening it.
- `typeof userSelect` preserves the narrow literal, so `Prisma.UserGetPayload<{ select: typeof userSelect }>` produces a type with _only_ the selected fields.
- Service signatures return the narrow `SafeUser` instead of `User`, so callers can't accidentally read `.password`.

### 6.4 Apply to

| Module        | New type            | Replaces                           |
| ------------- | ------------------- | ---------------------------------- |
| users         | `SafeUser`          | 5 casts in `users.service.ts`      |
| auth          | `SafeUser` (reused) | 1 cast in `auth.module.ts:25`      |
| categories    | `CategoryNode`      | 2 casts in `categories.service.ts` |
| address (new) | `AddressView`       | (greenfield — start clean)         |

**Confidence HIGH** — `Prisma.*GetPayload` and the `satisfies` pattern are documented in the official Prisma docs and are the de-facto Prisma 5+/6 idiom.

---

## 7. Test Organization

### 7.1 Co-located unit tests (services & controllers)

Keep Jest's NestJS default: `*.spec.ts` next to the file under test.

```
src/modules/users/
├── users.service.ts
├── users.service.spec.ts          ← unit test (mocks PrismaService)
├── users.controller.ts
└── users.controller.spec.ts       ← unit test (mocks UsersService)
```

Already enabled by the default `jest` config in `package.json`. No structural change needed.

**Unit-test mocking pattern (jest-mock-extended) — recommended:**

```typescript
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

let prisma: DeepMockProxy<PrismaClient>;

beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [UsersService, { provide: PrismaService, useValue: mockDeep<PrismaClient>() }],
  }).compile();

  prisma = module.get(PrismaService);
});
```

Add `jest-mock-extended` as a dev dep — it gives type-safe mocks of every Prisma method without manual stubs. Confidence HIGH (community standard for Prisma + Nest unit testing).

### 7.2 E2E tests in `test/` directory

Keep Nest's default `test/` folder, but split per-flow instead of the single trivial `app.e2e-spec.ts`:

```
test/
├── jest-e2e.json
├── helpers/
│   ├── test-app.ts             // creates Nest app w/ real PrismaService
│   ├── db-reset.ts             // truncate or prisma migrate reset
│   └── auth.helper.ts          // login → returns bearer token
├── auth.e2e-spec.ts            // register → verify → login → refresh → logout
├── order.e2e-spec.ts           // login → add to cart → create order → confirm payment
├── address.e2e-spec.ts         // CRUD + isDefault invariant
└── payment.e2e-spec.ts
```

**Database strategy for E2E:**

- Spin up a separate `TEST_DATABASE_URL` (local Postgres in Docker, or a Neon branch).
- Run `prisma migrate deploy` once at suite start.
- Reset state between specs with `await prisma.$executeRaw\`TRUNCATE TABLE ... CASCADE\``(faster than`migrate reset`).
- **Do not** mock Prisma in E2E — that defeats the purpose.

### 7.3 Test-pyramid targets for this milestone

| Layer       | Target                                                    |
| ----------- | --------------------------------------------------------- |
| Unit (svc)  | 80% line coverage for every `*.service.ts`                |
| Unit (ctrl) | Smoke tests (one happy path + one guard test)             |
| E2E         | 1 spec per major flow (auth, address, order, payment)     |
| Utility     | Already covered (`order-transitions.util.spec.ts`) — keep |

---

## 8. Build Order Recommendation

The ordering minimizes blocking dependencies and produces visible value first.

| #   | Slice                                                                                  | Why first                                                                                                  | Files touched                                                             |
| --- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | **Global throttler + Swagger gating + paymentMethod enum**                             | Pure config; no schema; unblocks security checklist; low risk                                              | `app.module.ts`, `main.ts`, `payment` DTO                                 |
| 2   | **Type-safety pass (`Prisma.*GetPayload`)**                                            | Touches existing services; do it before adding new ones to avoid spreading `as any` further                | `users`, `categories`, `auth`                                             |
| 3   | **TasksModule + ScheduleModule + cleanup wiring**                                      | Drop-in; immediately fixes unbounded table growth; no API surface change                                   | new `tasks/`, `app.module.ts`, `auth.module.ts` (export cleanup services) |
| 4   | **AddressModule (CRUD + tests)**                                                       | Self-contained, no other module depends on it yet                                                          | new `address/`                                                            |
| 5   | **Order integration with Address + snapshot**                                          | Depends on #4; also folds in the stock-deduct + collision-free order-number fixes in same transaction edit | `order.service.ts`, `order` DTOs                                          |
| 6   | **Order pagination + cart quantity-0 response**                                        | Small, isolated bug fixes                                                                                  | `order.service.ts`, `cart.service.ts`                                     |
| 7   | **Email transport (Nodemailer/Resend) + FRONTEND_URL validation + password-reset URL** | Independent vertical slice; can run in parallel with #5–#6 if desired                                      | new `mail/`, `auth.service.ts`, `env.validation.ts`                       |
| 8   | **Session revocation on change-password + revokeUserTokens() impl**                    | Builds on #3 (cleanup) and #7 (real emails for "your password changed" notice)                             | `users.service.ts`, `token-blacklist.service.ts`                          |
| 9   | **E2E test suite + service unit tests**                                                | Tests should be written _with_ each slice ideally, but ensure a final pass after all modules harden        | `test/`, `*.spec.ts` files                                                |

**Critical sequencing rules:**

- #2 must come before #4 — establishing the `Prisma.*GetPayload` idiom on existing code before adding the new Address module ensures consistency.
- #4 must come before #5 — Order cannot reference Address until AddressModule exists.
- #1 should be first — it's the lowest-risk highest-visibility change and gives an early "production-ready" signal.

---

## 9. Patterns to Follow

### 9.1 Module export discipline

If another module's service needs you, **`exports: [YourService]`** explicitly. Don't re-export via wildcard. The Address → Order integration depends on this.

### 9.2 Ownership filter at the data layer

Never write `findUnique({ where: { id } })` for user-owned resources. Always `findFirst({ where: { id, userId } })`. Applies to addresses, cart items, orders, and refresh tokens.

### 9.3 Immutable snapshots for historical records

For any field that captures "what the world looked like at time T" (order shipping address, order line items, invoice currency) — copy into JSON, do not reference. This is already correctly applied to `OrderItem.priceAtPurchase`; extend the pattern to `shippingAddressSnapshot`.

### 9.4 Transactional invariants

Multi-row invariants (only-one-default, stock-deduct-on-order) must run inside `prisma.$transaction([...])` or `prisma.$transaction(async tx => ...)`. Never split into sequential awaits.

---

## 10. Anti-Patterns to Avoid

### 10.1 `app.useGlobalGuards(new ThrottlerGuard(...))` in main.ts

**Why bad:** Hand-instantiating bypasses DI. `ThrottlerGuard` needs `ThrottlerStorage` and `Reflector` injected — manual construction breaks the storage backing and named-throttler config.
**Instead:** Use `{ provide: APP_GUARD, useClass: ThrottlerGuard }`.

### 10.2 `setInterval()` for cleanup jobs

**Why bad:** Doesn't survive restarts gracefully, no timezone handling, won't show in Nest's `SchedulerRegistry` for introspection, can leak timers in tests.
**Instead:** `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` via `@nestjs/schedule`.

### 10.3 Foreign-key reference to current Address from Order

**Why bad:** If the user later edits/deletes the address, historical orders silently mutate.
**Instead:** Snapshot the address fields into `Order.shippingAddressSnapshot` (Json column already exists).

### 10.4 `as any` cast after `select`

**Why bad:** Loses compile-time safety; schema drift surfaces only at runtime.
**Instead:** `Prisma.UserGetPayload<{ select: typeof userSelect }>` — see §6.

### 10.5 Reusing Address rows across users

**Why bad:** `Address.userId` is `Cascade` from User. If two users share a row (hypothetically), deleting one cascades the other.
**Instead:** Each address is strictly per-user. No deduplication.

---

## 11. Scalability Considerations

| Concern                 | At 100 users                        | At 10K users                | At 1M users (out of scope)                                              |
| ----------------------- | ----------------------------------- | --------------------------- | ----------------------------------------------------------------------- |
| Rate limiter storage    | In-memory                           | In-memory (single instance) | Redis adapter for `@nestjs/throttler`                                   |
| Token blacklist         | DB lookup per req                   | DB lookup (acceptable)      | Redis SET w/ TTL                                                        |
| Cleanup cron            | Single instance OK                  | Single instance OK          | Leader election or `pg_cron`                                            |
| Address lookups         | `WHERE userId = ?` (indexed via FK) | Same                        | Composite index on `(userId, isDefault)` if filtering defaults at scale |
| Order number generation | `${Date.now()}-${nanoid(5)}`        | Same (≈1e9 combinations/ms) | DB sequence + checksum                                                  |

For this portfolio milestone, only the "100 users" column matters. Document the rest as Out of Scope (matches `PROJECT.md`).

---

## Sources

- **NestJS Schedule** — Context7 `/nestjs/schedule` (HIGH): `@Cron`, `CronExpression` enum, `waitForCompletion`, `SchedulerRegistry`.
- **NestJS Throttler** — Context7 `/nestjs/throttler` (HIGH): `APP_GUARD` pattern, named throttlers, `ThrottlerBehindProxyGuard`, `seconds()`/`minutes()` helpers.
- **Prisma `GetPayload`** — Prisma official docs (HIGH): `Prisma.UserGetPayload<{ select: typeof X }>` with `satisfies` for type-safe projections.
- **jest-mock-extended** — community standard for typed Prisma mocks (MEDIUM, widely used in NestJS + Prisma tutorials).
- **Render free-tier sleep** — Render docs (MEDIUM): documented 15-min idle sleep on free web services.
- **Existing codebase** — `prisma/schema.prisma` (Address model lines 104–122; Order.shippingAddressSnapshot line 160), `src/modules/auth/services/*-token*.service.ts` (cleanup method signatures), `.planning/codebase/CONCERNS.md` (cast list, anti-patterns).

---

_Architecture research: 2026-05-16_
