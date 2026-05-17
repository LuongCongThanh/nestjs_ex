# Phase 2: Order, Cart & Address - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 02-order-cart-address
**Areas discussed:** 204 interceptor bypass, AddressModule placement, nanoid version strategy, Stock check inside transaction

---

## 204 Interceptor Bypass

| Option                                            | Description                                                                                                                                 | Selected |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Sửa interceptor: skip wrap khi statusCode === 204 | Thêm 1 check vào interceptor: `if (statusCode === 204) return of(undefined)`. Sạch, áp dụng cho tất cả các route 204 hiện tại và tương lai. | ✓        |
| Conditional trong controller dùng @Res()          | Inject response object vào handler, gọi res.status(204).send() thủ công. Bypass interceptor hoàn toàn nhưng mất testability.                |          |
| Tạo @SkipTransform() decorator riêng              | Custom decorator đặt metadata, interceptor check metadata để skip. Flexible nhưng over-engineer cho 1 use case.                             |          |

**User's choice:** Sửa interceptor — skip wrap khi statusCode === 204
**Notes:** Quyết định áp dụng cho tất cả 204 routes (DELETE /cart/items/:id, DELETE /cart cũng hưởng lợi từ fix này).

---

## AddressModule Placement

| Option                       | Description                                                                                                                                                         | Selected |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Standalone AddressModule mới | AddressController với @Controller('users/me/addresses'), tạo AddressModule import PrismaModule, đăng ký trong AppModule. Giống pattern của CartModule, OrderModule. | ✓        |
| Nằm trong UsersModule        | Thêm AddressController vào UsersModule.controllers[], route /users/me/addresses.                                                                                    |          |

**User's choice:** Standalone AddressModule mới
**Notes:** Class-level `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` được xác nhận — tất cả address routes đều private.

---

## nanoid Version Strategy

| Option                              | Description                                                                            | Selected |
| ----------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| nanoid@3                            | npm install nanoid@3 — phiên bản CJS, `import { nanoid } from 'nanoid'` hoạt động tốt. | ✓        |
| Node.js crypto (không cài thêm dep) | crypto.randomBytes(3).toString('hex') — 6 hex chars. SPEC đã nói rõ `nanoid(6)`.       |          |

**User's choice:** nanoid@3
**Notes:** Import syntax: `import { nanoid } from 'nanoid'` (TypeScript ES import, hoạt động với NestJS CommonJS build).

---

## Stock Check Inside Transaction

| Option                                   | Description                                                                                                                                                | Selected |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| ORM: tx.findMany + throw + tx.updateMany | 1. tx.product.findMany để lấy stock. 2. Check từng item, throw nếu fail (Prisma tự rollback). 3. Nếu pass, tạo order + updateMany stock. Simple, readable. | ✓        |
| $queryRaw SELECT FOR UPDATE              | Lock rows ngăn concurrent reads giữa check và update. Stronger isolation nhưng phức tạp hơn, cần raw SQL.                                                  |          |

**User's choice:** ORM: tx.findMany + throw + tx.updateMany
**Notes:** Dùng Prisma atomic decrement `{ stock: { decrement: qty } }` thay vì set absolute value. Chạy decrements song song với `Promise.all()`.

---

## Claude's Discretion

None — all areas had explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
