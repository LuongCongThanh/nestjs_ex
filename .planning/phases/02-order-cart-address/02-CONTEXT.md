# Phase 2: Order, Cart & Address - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>

## Phase Boundary

Deliver complete address management CRUD and eliminate every known correctness bug in the cart-to-order pipeline: stock decrement, collision-safe order numbers, addressId-based shipping snapshot, paginated order listing, and 204 No Content for cart item removal.

</domain>

<spec_lock>

## Requirements (locked via SPEC.md)

**10 requirements are locked.** See `02-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `02-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**

- `AddressModule` with full CRUD (`POST`, `GET`, `PATCH`, `DELETE` under `/users/me/addresses`)
- Atomic default address toggle (single Prisma transaction)
- Block delete of default address (400)
- Order creation: stock check + decrement inside `$transaction`
- `nanoid` package installation and integration into `orderNumber`
- `CreateOrderDto` migration from freeform `shippingAddress` to `addressId` (UUID)
- Full address snapshot (all 8 fields) stored in `shippingAddressSnapshot`
- 403 when `addressId` belongs to another user; 404 for non-existent address
- Paginated `GET /orders` with `{ data, page, limit, total }` for all roles
- `PATCH /cart/items/:id` with `quantity=0` → 204 No Content

**Out of scope (from SPEC.md):**

- Address validation (e.g., city/country format enforcement) — formatting is user's responsibility
- Address geocoding or delivery zone logic — separate feature
- Stock reservation (holding stock between cart add and order creation) — v2 concern
- Order cancellation auto-restores stock — separate requirement not in this phase
- Default address auto-select when creating order — user must explicitly pass `addressId`
- Payment method changes — that is Phase 3 (SEC-02)
- E2E tests for these flows — that is Phase 4 (TEST-03)

</spec_lock>

<decisions>

## Implementation Decisions

### 204 Interceptor Bypass

- **D-01:** Modify `TransformResponseInterceptor` to skip wrapping when `statusCode === 204`. Add early return: `if (statusCode === 204) return of(undefined)` before the `map` pipe. This is the single fix point that covers ALL current and future 204 routes.
- **D-02:** This fix applies globally — `DELETE /cart/items/:id`, `DELETE /cart` (already have `@HttpCode(204)`) also benefit from this fix alongside the new `PATCH /cart/items/:id` (qty=0) case.

### AddressModule Architecture

- **D-03:** Create a **standalone `AddressModule`** at `src/modules/addresses/`. `AddressController` uses `@Controller('users/me/addresses')`. Module imports `PrismaModule`, is registered in `AppModule.imports[]` — same pattern as `CartModule` and `OrderModule`.
- **D-04:** `AddressController` uses `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` at class level — all address routes are private, consistent with Cart and Order controllers.

### nanoid Version

- **D-05:** Install `nanoid@3` (CommonJS-compatible). Import as `import { nanoid } from 'nanoid'`. nanoid v4+ is pure ESM and would cause `ERR_REQUIRE_ESM` in NestJS CommonJS projects.
- **D-06:** `orderNumber` format: `` `ORD-${Date.now()}-${nanoid(6)}` `` — replaces the existing `` `ORD-${Date.now()}` `` in `order.service.ts:30`.

### Stock Check Inside Transaction

- **D-07:** Use **Prisma ORM approach** (not `$queryRaw`): inside `prisma.$transaction(async (tx) => { ... })`, call `tx.product.findMany({ where: { id: { in: productIds } } })` to fetch current stock, then iterate cart items to check — throw `BadRequestException` before creating any order rows if any item fails. No `SELECT FOR UPDATE` — default READ COMMITTED isolation is sufficient for a portfolio project.
- **D-08:** Use **atomic Prisma decrement** for stock updates: `tx.product.update({ where: { id }, data: { stock: { decrement: quantity } } })`. Run decrements in `Promise.all()` for parallel execution. Do NOT calculate `newStock = current - qty` in JS and set absolute value — use Prisma's atomic `{ decrement: N }` operator.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Requirements

- `.planning/phases/02-order-cart-address/02-SPEC.md` — Locked requirements, boundaries, acceptance criteria. MUST read before planning.

### Phase Context

- `.planning/ROADMAP.md` §Phase 2 — Phase goal, success criteria, dependency on Phase 1
- `.planning/REQUIREMENTS.md` — ORD-01, ORD-02, ORD-03, CART-01, ADDR-01, ADDR-02, ADDR-03

### Files to Modify

- `src/modules/order/order.service.ts` — createOrder (stock check + decrement + nanoid + addressId), findAll (pagination)
- `src/modules/order/dto/create-order.dto.ts` — replace `shippingAddress` with `addressId`
- `src/modules/cart/cart.service.ts` — updateItemQuantity return type (void when qty=0)
- `src/common/interceptors/transform-response.interceptor.ts` — add 204 skip logic
- `src/app.module.ts` — register AddressModule

### New Files to Create

- `src/modules/addresses/addresses.module.ts`
- `src/modules/addresses/addresses.controller.ts`
- `src/modules/addresses/addresses.service.ts`
- `src/modules/addresses/dto/create-address.dto.ts`
- `src/modules/addresses/dto/update-address.dto.ts`

### Existing Patterns to Reuse

- `src/modules/cart/cart.controller.ts` — class-level `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` pattern
- `src/modules/cart/cart.module.ts` — standalone module structure (imports PrismaModule)
- `src/common/dto/pagination.dto.ts` — MUST be reused for `GET /orders` query params (do NOT create new DTO)
- `src/modules/users/users.service.ts` — `findAll` pagination pattern for reference

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `PaginationDto` at `src/common/dto/pagination.dto.ts` — `page` + `limit` fields, already validated. Reuse for `GET /orders` query params.
- `JwtAuthGuard` at `src/common/guards/jwt-auth.guard.ts` — standard JWT guard used by Cart and Order controllers.
- `GetUser` decorator at `src/common/decorators/get-user.decorator.ts` — extracts user from JWT payload. Used across all authenticated controllers.
- `ParseUUIDPipe` (NestJS built-in) — already used in UsersController for UUID path params. Use for `addressId` and address `:id` params.

### Established Patterns

- **Module structure:** each feature module imports `PrismaModule`, has standalone `module.ts` / `controller.ts` / `service.ts`, is registered in `AppModule.imports[]`.
- **Controller auth:** `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` at class level for all private controllers.
- **Response format:** `TransformResponseInterceptor` wraps all responses as `{ statusCode, success, message, data }`. After D-01 fix, 204 responses will bypass this.
- **Prisma transactions:** `prisma.$transaction(async (tx) => { ... })` pattern already used in `order.service.ts:29`.

### Integration Points

- `AppModule.imports[]` — new `AddressModule` must be added here.
- `OrderService` — `createOrder` is the central integration point for stock decrement + addressId lookup.
- `TransformResponseInterceptor` — one-line fix for 204 bypass affects `cart.controller.ts` DELETE routes immediately.

### Known Bugs (current state)

- `order.service.ts:30` — `orderNumber = \`ORD-${Date.now()}\`` → collision-prone
- `order.service.ts:29-54` — transaction never decrements `product.stock`
- `order.service.ts:61-65` — `findAll` returns raw array, no pagination
- `create-order.dto.ts:5-8` — `shippingAddress: Record<string, unknown>` → needs `addressId: string`
- `cart.service.ts:47-50` — `return null` when qty=0 → controller returns 200+null instead of 204
- `transform-response.interceptor.ts:44` — wraps null/undefined but does NOT check statusCode 204

</code_context>

<specifics>

## Specific Ideas

- Order number format must match regex `/^ORD-\d+-[A-Za-z0-9_-]{6}$/` (from SPEC.md acceptance criteria).
- The stock check error message format is: `"Insufficient stock for: {productName} (requested {qty}, available {stock})"`.
- Address snapshot must include all 8 fields: `fullName`, `phone`, `address`, `ward`, `district`, `city`, `country`, `postalCode`.

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 02-order-cart-address_
_Context gathered: 2026-05-17_
