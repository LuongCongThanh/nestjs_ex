---
phase: 02-order-cart-address
plan: 01
subsystem: common
tags: [interceptor, nanoid, 204, transform-response]
dependency_graph:
  requires: []
  provides: [nanoid@3, TransformResponseInterceptor-204-bypass]
  affects: [src/common/interceptors/transform-response.interceptor.ts, package.json]
tech_stack:
  added: [nanoid@3.3.12]
  patterns: [rxjs-map-bypass, statusCode-guard]
key_files:
  created: []
  modified:
    - package.json
    - src/common/interceptors/transform-response.interceptor.ts
decisions:
  - nanoid@3 (CommonJS-compatible) chọn thay vì v4+ (pure ESM) để tránh ERR_REQUIRE_ESM
  - 204 bypass là nhánh đầu tiên trong map() callback — trước null/undefined check — để tránh wrapping
  - Type cast `undefined as unknown as Response<T>` giữ return type compatible
metrics:
  duration: ~5 minutes
  completed: 2026-05-18
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 02 Plan 01: nanoid + Interceptor 204 Bypass — Summary

**One-liner:** Install nanoid@3 (CJS-compatible) và patch TransformResponseInterceptor để bất kỳ response 204 nào bypass JSON envelope — shared infra cho Plan 03 (order number) và Plan 04 (cart 204).

## nanoid Version Installed

`"nanoid": "^3.3.12"` — production dependency, named export `import { nanoid } from 'nanoid'`, CJS-safe.

## Interceptor 204 Bypass — Vị Trí Chèn

File: `src/common/interceptors/transform-response.interceptor.ts`

Nhánh được chèn **trước** `if (data === null || data === undefined)` (line 48), ngay sau `const statusCode = response.statusCode;`:

```typescript
if (statusCode === 204) {
  return undefined as unknown as Response<T>;
}
```

## Routes Hưởng Lợi từ Bypass

| Route | Method | Khi nào 204 |
|-------|--------|------------|
| DELETE /cart | DELETE | Luôn luôn |
| DELETE /cart/items/:id | DELETE | Luôn luôn |
| DELETE /users/me/addresses/:id | DELETE | Khi isDefault=false |
| PATCH /cart/items/:id | PATCH | Khi quantity=0 (Plan 04) |

## Acceptance Criteria — PASSED

- `package.json` dependencies chứa `"nanoid"` với version `"^3.3.12"`
- `transform-response.interceptor.ts` chứa `statusCode === 204` đúng một lần
- Nhánh 204 đứng **trước** `data === null || data === undefined` trong file
- Không có import mới nào được thêm
- `npm run build` exits 0
