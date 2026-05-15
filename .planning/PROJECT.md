# E-Commerce API — NestJS

## What This Is

Backend REST API cho một nền tảng thương mại điện tử xây dựng bằng NestJS, Prisma, PostgreSQL. Quản lý toàn bộ vòng đời từ danh mục sản phẩm, giỏ hàng, đặt hàng đến thanh toán. Dự án mục tiêu học tập và portfolio — ưu tiên code chất lượng, best practices, và tính hoàn chỉnh của từng module.

## Core Value

Mỗi module phải hoàn chỉnh và đúng: không có bug đã biết còn tồn tại, business logic được test, và API hoạt động đúng như thiết kế.

## Requirements

### Validated

- ✓ Auth (JWT + refresh token rotation, login/register/logout) — existing
- ✓ User CRUD với soft-delete và phân quyền (user/staff/admin) — existing
- ✓ Category tree (cha-con, cycle prevention) — existing
- ✓ Product CRUD với soft-delete, pagination, filtering — existing
- ✓ Cart per-user với lazy creation và item management — existing
- ✓ Order lifecycle với state machine (pending → confirmed → processing → shipped → delivered/cancelled/refunded) — existing
- ✓ Payment creation và manual confirmation bởi staff — existing
- ✓ Health check endpoint, Swagger docs, rate limiting, Helmet — existing

### Active

- [ ] Order creation trừ stock và validate tồn kho
- [ ] Order number generation không bị collision khi concurrent
- [ ] GET /orders có pagination (hiện tại trả về tất cả không giới hạn)
- [ ] Cart item update với quantity=0 trả về response rõ ràng (204 hoặc `{deleted: true}`)
- [ ] Address API — module, controller, service cho User address management
- [ ] Email transport thực — thay thế simulation bằng Nodemailer/Resend
- [ ] FRONTEND_URL validated tại startup; password-reset link dùng FRONTEND_URL
- [ ] TokenBlacklistService.revokeUserTokens() được implement
- [ ] Swagger ẩn trong production
- [ ] paymentMethod là enum (cod, bank_transfer, credit_card), không phải free-form string
- [ ] Rate limiting áp dụng globally (không chỉ AuthController)
- [ ] Change-password revoke tất cả sessions hiện tại
- [ ] Service unit tests (AuthService, UsersService, ProductsService, CartService, OrderService, PaymentService)
- [ ] E2E tests cho các flow chính (auth flow, order flow)

### Out of Scope

- Payment gateway thực (Stripe, VNPay) — phức tạp, ngoài phạm vi portfolio hiện tại
- OTP/2FA — DTOs tồn tại nhưng incomplete, defer sang milestone sau
- Redis cache cho token blacklist — optimization cho scale, chưa cần ở quy mô portfolio
- Full-text search với GIN index — optimization, defer
- Repository abstraction layer — overhead không cần thiết ở scale hiện tại
- Worker threads / horizontal scaling — infrastructure concern

## Context

**Codebase hiện tại (brownfield):**

- 7 feature modules hoạt động: auth, users, categories, products, cart, order, payment
- Codebase map đầy đủ tại `.planning/codebase/`
- 4 bugs đã xác định (stock, collision, pagination, cart null)
- 3 critical features còn thiếu (Address API, email thật, password-reset URL)
- 5 security gaps (Swagger, paymentMethod enum, rate limit global, session revocation, transactionId)
- Test coverage: chỉ utility functions, services/controllers chưa có test

**Cấu trúc tiếp cận:**
Mỗi phase hoàn thiện một nhóm liên quan — fix bugs + complete features + security + tests trong cùng một phase. Không tách riêng "chỉ bug" hay "chỉ security".

**Stack:**
NestJS 11, Prisma 6, PostgreSQL 16, TypeScript 5.7, Jest 29. Deploy: Render.com + Neon.

## Constraints

- **Tech stack**: NestJS + Prisma — không thay đổi ORM hay framework
- **Database**: PostgreSQL — không đổi sang NoSQL
- **Scope**: Portfolio/learning — không cần production-grade scaling (Redis, worker threads)
- **Email**: Phải tích hợp email transport thực (ít nhất Nodemailer hoặc Resend) để email flows hoạt động

## Key Decisions

| Decision                      | Rationale                                                           | Outcome   |
| ----------------------------- | ------------------------------------------------------------------- | --------- |
| Không dùng repository layer   | Scope nhỏ, Prisma đủ rõ ràng; overhead không đáng ở portfolio scale | — Pending |
| Organize phases theo module   | "Tất cả song song" — mỗi phase hoàn thiện một domain đầy đủ         | — Pending |
| Email: Nodemailer hoặc Resend | Không phụ thuộc paid service; Nodemailer free, Resend có free tier  | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-05-16 after initialization_
