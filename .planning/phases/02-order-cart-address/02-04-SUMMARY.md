---
phase: 02-order-cart-address
plan: 04
subsystem: cart
tags: [cart, 204, dual-status, passthrough, nestjs]
dependency_graph:
  requires: [TransformResponseInterceptor-204-bypass]
  provides: [CartController-dual-status-updateItem]
  affects: [src/modules/cart/cart.service.ts, src/modules/cart/cart.controller.ts]
tech_stack:
  added: []
  patterns: [res-passthrough, dual-status-handler, conditional-status-code]
key_files:
  created: []
  modified:
    - src/modules/cart/cart.service.ts
    - src/modules/cart/cart.controller.ts
decisions:
  - Option C được chọn — @Res({ passthrough: true }) + res.status() thay vì @HttpCode static
  - passthrough: true bắt buộc — giữ NestJS serialization + interceptor pipeline hoạt động
  - Service trả void (bare return) thay vì null — controller phân biệt via result === undefined
  - Không thêm @HttpCode(204) static trên updateItem — sẽ phá vỡ qty>0 path (luôn 204)
metrics:
  duration: ~5 minutes
  completed: 2026-05-18
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 02 Plan 04: Cart PATCH Dual-Status 200/204 — Summary

**One-liner:** Fix CART-01 — `PATCH /cart/items/:id` với `quantity: 0` trả 204 empty body; với `quantity > 0` trả 200 wrapped envelope. Dùng `@Res({ passthrough: true })` + interceptor 204 bypass từ Plan 01.

## Chosen Approach (Option C)

Single handler không thể dùng `@HttpCode(204)` static vì sẽ force 204 cả khi qty > 0.

**Giải pháp:** `@Res({ passthrough: true }) res: Response` cho phép set status code dynamically:
- `quantity === 0` → `res.status(204); return;` → interceptor thấy `statusCode === 204` → empty body
- `quantity > 0` → `return result;` → interceptor wrap bình thường → 200 + envelope

## Signature Change

```typescript
// BEFORE
updateItem(@GetUser() user, @Param(...) itemId, @Body() dto) { ... }

// AFTER
async updateItem(@GetUser() user, @Param(...) itemId, @Body() dto, @Res({ passthrough: true }) res: Response) { ... }
```

## Regression Verification

DELETE /cart/items/:id và DELETE /cart đã có `@HttpCode(HttpStatus.NO_CONTENT)` static — không bị ảnh hưởng, vẫn trả 204 + empty body nhờ Plan 01 bypass.

## Acceptance Criteria — PASSED

- `cart.service.ts` không chứa `return null` trong `updateItemQuantity`
- `cart.controller.ts` chứa `passthrough: true` + `res.status(HttpStatus.NO_CONTENT)`
- `updateItem` handler không có `@HttpCode(HttpStatus.NO_CONTENT)` decorator
- Handler là `async`, import `Res` từ `@nestjs/common`, `Response` từ `express`
- `npm run build` exits 0
