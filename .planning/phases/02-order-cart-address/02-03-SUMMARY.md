---
phase: 02-order-cart-address
plan: 03
subsystem: orders
tags: [orders, nanoid, stock-decrement, address-snapshot, pagination, prisma-transaction]
dependency_graph:
  requires: [nanoid@3, AddressModule, PaginationDto]
  provides: [OrderService-fixed, CreateOrderDto-addressId, paginated-findAll]
  affects: [src/modules/order/order.service.ts, src/modules/order/order.controller.ts, src/modules/order/dto/create-order.dto.ts]
tech_stack:
  added: []
  patterns: [prisma-transaction, atomic-decrement, address-snapshot, pagination-getters]
key_files:
  created: []
  modified:
    - src/modules/order/dto/create-order.dto.ts
    - src/modules/order/order.service.ts
    - src/modules/order/order.controller.ts
decisions:
  - addressId UUID thay thế shippingAddress freeform — đóng vector injection
  - Snapshot được build explicit 8 fields (không spread) — tránh leak id/userId/isDefault
  - tx.address.findUnique bên trong $transaction để ownership check atomic với stock check
  - Atomic decrement dùng { decrement: qty } Prisma operator — không tính JS-side
  - findAll trả flat shape { data, page, limit, total } — KHÔNG dùng createPaginatedResult (meta shape sai SPEC)
  - PaginationDto getters query.skip / query.take được dùng trực tiếp
metrics:
  duration: ~15 minutes
  completed: 2026-05-18
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 3
---

# Phase 02 Plan 03: Order Bug Fixes — Summary

**One-liner:** Fix 4 documented bugs trong OrderService: stock decrement atomic, collision-safe orderNumber, addressId snapshot từ DB, paginated findAll — tất cả trong một transaction body thống nhất.

## DTO Migration

`CreateOrderDto`: xóa `shippingAddress: Record<string, unknown>` + `@IsObject()`, thêm `addressId: string` + `@IsUUID()`.

## Order Number Format

```
ORD-${Date.now()}-${nanoid(6)}
```
Pattern: `/^ORD-\d+-[A-Za-z0-9_-]{6}$/`

## Transaction Step Ordering (createOrder)

1. Resolve address + ownership check (403/404) — bên trong tx
2. Build 8-field snapshot thủ công (fullName, phone, address, ward, district, city, country, postalCode)
3. Fetch product stock cho tất cả cart items
4. Stock check — throw 400 trước khi tạo bất kỳ row nào
5. Generate `orderNumber = \`ORD-${Date.now()}-${nanoid(6)}\``
6. `tx.order.create` với snapshot
7. `Promise.all` atomic decrement tất cả products
8. `tx.cartItem.deleteMany` — empty cart

## Pagination Response Shape

```typescript
{ data: Order[], page: number, limit: number, total: number }
```
Flat shape theo SPEC — KHÔNG phải `{ data, meta: { ... } }` của `createPaginatedResult`.

## Deprecated Field Removed

`dto.shippingAddress` — đã xóa hoàn toàn, không còn xuất hiện trong codebase.

## Acceptance Criteria — PASSED

- `create-order.dto.ts` chứa `addressId` + `@IsUUID()`, không chứa `shippingAddress`
- `order.service.ts` chứa: `import { nanoid }`, `decrement`, `Insufficient stock for:`, `tx.address.findUnique`, `Promise.all`
- `order.service.ts` không chứa `dto.shippingAddress`
- `findAll` dùng `query.skip` + `query.take` getters, có `order.count()`, trả flat shape
- `order.controller.ts` có `@Query() query: PaginationDto` trên `findAll`
- `npm run build` exits 0
