# Requirements: E-Commerce API — NestJS

**Defined:** 2026-05-16
**Core Value:** Mỗi module phải hoàn chỉnh và đúng: không có bug đã biết còn tồn tại, business logic được test, và API hoạt động đúng như thiết kế.

## v1 Requirements

### Order & Cart Correctness

- [ ] **ORD-01**: Order creation trừ stock của từng sản phẩm trong cùng Prisma transaction, và fail nếu stock không đủ
- [ ] **ORD-02**: Order number không bị collision dưới concurrent load (dùng `ORD-{Date.now()}-{nanoid(6)}` thay vì chỉ timestamp)
- [ ] **ORD-03**: `GET /orders` (admin/staff) trả về kết quả có pagination (page, limit, total) thay vì trả về toàn bộ
- [ ] **CART-01**: `PATCH /cart/items/:id` với `quantity: 0` xóa item và trả về `204 No Content` thay vì `null`

### Address Management

- [x] **ADDR-01**: User có thể tạo, xem danh sách, cập nhật và xóa các địa chỉ của mình (`/users/me/addresses`)
- [x] **ADDR-02**: User có thể đánh dấu một address là mặc định (atomic — tự động bỏ `isDefault` trên address cũ)
- [ ] **ADDR-03**: Order creation chấp nhận `addressId` thay vì freeform JSON, và snapshot các fields địa chỉ vào Order tại thời điểm đặt hàng

### Email & Auth Completion

- [ ] **EMAIL-01**: Hệ thống gửi email thực (verification, password reset) thông qua `@nestjs-modules/mailer` + Nodemailer — không còn `[EMAIL SIMULATION]` log
- [ ] **AUTH-01**: `FRONTEND_URL` được validate tại startup (Joi); password-reset link dùng `FRONTEND_URL` thay vì hardcode `https://example.com`
- [ ] **AUTH-02**: `TokenBlacklistService.revokeUserTokens()` được implement đầy đủ — `logoutAll` revoke tất cả access tokens đang hoạt động của user
- [ ] **AUTH-03**: `changePassword` revoke tất cả refresh tokens hiện tại của user sau khi đổi password thành công

### Security Hardening

- [ ] **SEC-01**: Swagger UI chỉ accessible trong môi trường non-production (gated bởi `NODE_ENV`)
- [ ] **SEC-02**: `paymentMethod` là enum (`cod`, `bank_transfer`, `credit_card`) với `@IsEnum` validation — kèm data migration backfill cho rows hiện tại
- [ ] **SEC-03**: Rate limiting áp dụng globally via `APP_GUARD` provider trong `AppModule` (không chỉ `AuthController`)

### Infrastructure & Code Quality

- [ ] **INFRA-01**: `@nestjs/schedule` TasksModule với cron job cleanup expired tokens hàng ngày (`TokenBlacklist`, `RefreshToken`, `EmailVerification`)
- [ ] **INFRA-02**: Các `as any` / `as unknown as User` casts được thay thế bằng `Prisma.UserGetPayload<{ select: typeof userSelect }>` type-safe projections
- [ ] **INFRA-03**: `FindProductsQueryDto` và `FindUsersQueryDto` extend `PaginationDto` thay vì duplicate fields

### Test Coverage

- [ ] **TEST-01**: `configureApp(app)` được extract từ `main.ts` để E2E tests dùng cùng global pipes, filters, prefix như production
- [ ] **TEST-02**: Service unit tests với `jest-mock-extended` cho: `AuthService`, `UsersService`, `ProductsService`, `CategoriesService`, `CartService`, `OrderService`, `PaymentService`
- [ ] **TEST-03**: E2E tests với `@chax-at/transactional-prisma-testing` cho: auth flow (register → verify email → login → refresh → logout), order flow (add to cart → create order → payment)

## v2 Requirements

### Performance

- **PERF-01**: Redis-backed token blacklist lookup (thay thế DB query per request)
- **PERF-02**: GIN index cho full-text product search trên `name` và `description`
- **PERF-03**: Redis adapter cho ThrottlerModule (multi-instance rate limiting)

### Auth Enhancements

- **AUTH-V2-01**: OTP/2FA flow — implement các DTOs đã tồn tại thành endpoints thực
- **AUTH-V2-02**: OAuth login (Google, GitHub)

### Payments

- **PAY-V2-01**: Tích hợp payment gateway thực (Stripe hoặc VNPay) với webhook verification

## Out of Scope

| Feature                             | Reason                                      |
| ----------------------------------- | ------------------------------------------- |
| Redis (token blacklist, throttler)  | Scaling concern, chưa cần ở portfolio scale |
| Repository abstraction layer        | Overhead không đáng, Prisma đủ rõ ràng      |
| Real payment gateway                | Phức tạp, ngoài phạm vi milestone này       |
| OTP/2FA full implementation         | DTOs đã có nhưng defer đến milestone sau    |
| Full-text search GIN index          | Performance optimization, defer             |
| Worker threads / horizontal scaling | Infrastructure concern                      |
| Reviews, coupons, multi-currency    | Scope quá rộng cho portfolio                |

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| ORD-01      | Phase 2 | Pending |
| ORD-02      | Phase 2 | Pending |
| ORD-03      | Phase 2 | Pending |
| CART-01     | Phase 2 | Pending |
| ADDR-01     | Phase 2 | Complete |
| ADDR-02     | Phase 2 | Complete |
| ADDR-03     | Phase 2 | Pending |
| EMAIL-01    | Phase 3 | Pending |
| AUTH-01     | Phase 3 | Pending |
| AUTH-02     | Phase 3 | Pending |
| AUTH-03     | Phase 3 | Pending |
| SEC-01      | Phase 1 | Pending |
| SEC-02      | Phase 3 | Pending |
| SEC-03      | Phase 1 | Pending |
| INFRA-01    | Phase 1 | Pending |
| INFRA-02    | Phase 1 | Pending |
| INFRA-03    | Phase 1 | Pending |
| TEST-01     | Phase 4 | Pending |
| TEST-02     | Phase 4 | Pending |
| TEST-03     | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---

_Requirements defined: 2026-05-16_
_Last updated: 2026-05-16 after initial definition_
