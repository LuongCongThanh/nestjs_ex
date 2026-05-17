# Phase 2: Order, Cart & Address — Specification

**Created:** 2026-05-17
**Ambiguity score:** 0.188 (gate: ≤ 0.20)
**Requirements:** 10 locked

## Goal

Deliver complete address management CRUD and eliminate every known correctness bug in the cart-to-order pipeline: stock decrement, collision-safe order numbers, paginated order listing, addressId-based shipping, and 204 response for cart item removal.

## Background

The `Address` model and `addresses` table exist in the Prisma schema with all required fields, but no `AddressModule`, `AddressController`, or `AddressService` exists — zero address endpoints are exposed. The `OrderService` has four bugs: (1) stock is never decremented on order creation, (2) `orderNumber` uses `ORD-${Date.now()}` without nanoid — collision-prone under concurrent requests, (3) `shippingAddressSnapshot` is populated from a freeform `Record<string, unknown>` DTO field instead of a validated address record, (4) `findAll` returns a raw array with no pagination. The `CartService.updateItemQuantity` returns `null` when `quantity=0` and the controller returns HTTP 200 with a null body instead of 204 No Content. `nanoid` is not currently installed.

## Requirements

1. **AddressModule bootstrap**: A new `AddressModule` is created with `AddressService` and `AddressController` registered in `AppModule`.
   - Current: No `src/modules/addresses/` directory; no address endpoints
   - Target: `AddressModule` exists, imports `PrismaModule`, is imported by `AppModule`, all address routes are accessible
   - Acceptance: `GET /users/me/addresses` returns 200 (empty array for new user); module compiles without errors

2. **Address CRUD**: Users can create, list, update, and delete their own addresses via `/users/me/addresses`.
   - Current: No address endpoints
   - Target: `POST /users/me/addresses`, `GET /users/me/addresses`, `PATCH /users/me/addresses/:id`, `DELETE /users/me/addresses/:id` — all scoped to the authenticated user
   - Acceptance: CRUD round-trip: create address → list returns it → update a field → fetch shows updated → delete → list is empty

3. **Default address toggle**: Marking an address as default atomically unsets the previous default in a single transaction.
   - Current: `Address.isDefault` field exists in schema but no toggle logic
   - Target: `PATCH /users/me/addresses/:id` with `{ isDefault: true }` sets that address as default and sets all other addresses of the same user to `isDefault: false` in the same Prisma transaction
   - Acceptance: User has 2 addresses (A=default, B=non-default); PATCH B with `isDefault: true` → A.isDefault=false, B.isDefault=true; no intermediate state where 2 addresses are both default

4. **Block delete of default address**: Deleting the current default address is rejected.
   - Current: No delete protection
   - Target: `DELETE /users/me/addresses/:id` returns `400 Bad Request` if the address has `isDefault: true`
   - Acceptance: Attempting to delete the default address returns 400 with an error message; deleting a non-default address returns 204

5. **Stock decrement on order creation**: Creating an order decrements each product's stock atomically; if any item has insufficient stock, the entire transaction fails and no stock is changed.
   - Current: `createOrder` wraps in `$transaction` but never calls `product.update`; stock is never touched
   - Target: Inside the transaction, for each cart item: check `product.stock >= item.quantity`; if any fails, throw `BadRequestException` with message `"Insufficient stock for: {productName} (requested {qty}, available {stock})"` BEFORE creating order; if all pass, decrement each product's stock with `{ stock: { decrement: quantity } }`
   - Acceptance: (a) Order with sufficient stock decrements all product stocks by correct amounts; (b) Order where one item exceeds stock → 400 error with product name, no order created, no stock changed (verified via DB read)

6. **Collision-safe order number**: Order numbers use `ORD-{Date.now()}-{nanoid(6)}` format.
   - Current: `orderNumber = \`ORD-${Date.now()}\`` — sequential timestamps collide under concurrent requests
   - Target: `orderNumber = \`ORD-${Date.now()}-${nanoid(6)}\``— requires installing`nanoid` package
   - Acceptance: 20 orders created in rapid succession (loop) all have unique `orderNumber` values; format matches regex `/^ORD-\d+-[A-Za-z0-9_-]{6}$/`

7. **addressId in CreateOrderDto**: Order creation accepts `addressId` (UUID, required) and rejects freeform `shippingAddress`.
   - Current: `CreateOrderDto` has `shippingAddress: Record<string, unknown>` — freeform JSON, no validation
   - Target: `CreateOrderDto` replaces `shippingAddress` with `addressId: string` (`@IsUUID()`); service looks up the address, returns `403 Forbidden` if the address does not belong to the requesting user, then snapshots all address fields into `shippingAddressSnapshot`
   - Acceptance: (a) `POST /orders` with valid `addressId` → order created with `shippingAddressSnapshot` containing all 8 fields (fullName, phone, address, ward, district, city, country, postalCode); (b) `addressId` belonging to another user → 403; (c) non-existent `addressId` → 404

8. **Full address snapshot**: The snapshot captures all 8 address fields at creation time.
   - Current: `shippingAddressSnapshot` is populated from unvalidated freeform JSON
   - Target: Snapshot contains: `fullName`, `phone`, `address`, `ward`, `district`, `city`, `country`, `postalCode` — sourced from the resolved `Address` record, not from request body
   - Acceptance: Update the address after order creation; the order's `shippingAddressSnapshot` still contains the original values

9. **Paginated order listing**: `GET /orders` returns `{ data, page, limit, total }` for all roles (user sees own orders, admin/staff see all).
   - Current: `findAll` returns raw `Order[]` array with no pagination metadata
   - Target: `findAll(userId, role, query: PaginationDto)` returns `{ data: Order[], page: number, limit: number, total: number }` using Prisma `findMany` + `count` with `skip/take`
   - Acceptance: Database with 25 orders for user; `GET /orders?page=2&limit=10` returns `{ data: [10 items], page: 2, limit: 10, total: 25 }`

10. **Cart PATCH quantity=0 returns 204**: `PATCH /cart/items/:id` with `{ quantity: 0 }` removes the item and responds with 204 No Content.
    - Current: Service deletes item and returns `null`; controller returns HTTP 200 with null body
    - Target: `updateItemQuantity` returns `void` when `quantity=0`; controller uses `@HttpCode(HttpStatus.NO_CONTENT)` on the `updateItem` handler; the transform interceptor does not wrap the 204 response in a data envelope
    - Acceptance: `PATCH /cart/items/:id` with `{ quantity: 0 }` → HTTP 204, empty body, item removed from DB; `PATCH /cart/items/:id` with `{ quantity: 2 }` → HTTP 200, updated item in response body

## Boundaries

**In scope:**

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

**Out of scope:**

- Address validation (e.g., city/country format enforcement) — formatting is user's responsibility
- Address geocoding or delivery zone logic — separate feature
- Stock reservation (holding stock between cart add and order creation) — v2 concern
- Order cancellation auto-restores stock — separate requirement not in this phase
- Default address auto-select when creating order — user must explicitly pass `addressId`
- Payment method changes — that is Phase 3 (SEC-02)
- E2E tests for these flows — that is Phase 4 (TEST-03)

## Constraints

- `nanoid` must be installed as a production dependency (`npm install nanoid`)
- `nanoid` v3.x (CommonJS-compatible) if the project uses CommonJS modules; verify `package.json` `"type"` field
- The atomic default toggle and stock decrement MUST use `prisma.$transaction` — no separate sequential updates
- `shippingAddressSnapshot` must be populated from the resolved `Address` DB record, NOT from any user-supplied data
- `PaginationDto` (already exists at `src/common/dto/pagination.dto.ts`) must be reused for `GET /orders` query params — no new DTO

## Acceptance Criteria

- [ ] `GET /users/me/addresses` returns 200 with empty array for a new user
- [ ] CRUD round-trip on addresses completes without error (create → list → update → delete)
- [ ] PATCH address with `isDefault: true` sets it as default and unsets previous default atomically (no 2 defaults simultaneously)
- [ ] DELETE on a default address returns 400; DELETE on non-default returns 204
- [ ] Order creation with insufficient stock → 400 with product name in message, no order row created, no stock change
- [ ] Order creation with sufficient stock → order created, each product's stock decremented by item quantity
- [ ] 20 rapid-fire orders all have unique `orderNumber` values matching `/^ORD-\d+-[A-Za-z0-9_-]{6}$/`
- [ ] `POST /orders` with `addressId` from another user → 403; non-existent `addressId` → 404
- [ ] Order's `shippingAddressSnapshot` contains all 8 address fields sourced from DB record
- [ ] Updating the address after order creation does NOT change the order's snapshot
- [ ] `GET /orders?page=2&limit=10` returns `{ data, page: 2, limit: 10, total }` with correct item count
- [ ] `PATCH /cart/items/:id` with `quantity: 0` → HTTP 204, empty body, item removed from DB
- [ ] `PATCH /cart/items/:id` with `quantity: 2` → HTTP 200, updated item in response

## Ambiguity Report

| Dimension           | Score | Min   | Status | Notes                                             |
| ------------------- | ----- | ----- | ------ | ------------------------------------------------- |
| Goal Clarity        | 0.85  | 0.75  | ✓      | 4 independent work streams clearly defined        |
| Boundary Clarity    | 0.82  | 0.70  | ✓      | Out-of-scope list covers stock restore, geocoding |
| Constraint Clarity  | 0.75  | 0.65  | ✓      | nanoid version caveat, PaginationDto reuse locked |
| Acceptance Criteria | 0.80  | 0.70  | ✓      | 13 pass/fail criteria covering all requirements   |
| **Ambiguity**       | 0.188 | ≤0.20 | ✓      |                                                   |

## Interview Log

| Round | Perspective     | Question summary                       | Decision locked                                                                    |
| ----- | --------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| 1     | Researcher      | nanoid installed?                      | Not installed — must add as prod dep                                               |
| 1     | Researcher      | addressId ownership error code?        | 403 Forbidden (not 404)                                                            |
| 1     | Researcher      | Stock error message format?            | 400 + product name (requested N, available M)                                      |
| 2     | Researcher      | Pagination scope (all users or admin)? | All users — user sees own orders, both paginated                                   |
| 2     | Simplifier      | Which address fields to snapshot?      | All 8 fields (fullName, phone, address, ward, district, city, country, postalCode) |
| 2     | Simplifier      | 204 implementation approach?           | @HttpCode(204) + service returns void                                              |
| 3     | Boundary Keeper | Delete default address behavior?       | 400 — refuse deletion                                                              |
| 3     | Boundary Keeper | addressId required or optional?        | Required — all orders must specify addressId                                       |

---

_Phase: 02-order-cart-address_
_Spec created: 2026-05-17_
_Next step: /gsd:discuss-phase 2 — implementation decisions (how to build what's specified above)_
