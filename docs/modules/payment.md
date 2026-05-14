# Payment Module

Quản lý **Payment** — giao dịch tài chính gắn với một Order. Khi Payment được confirm, Order tự động chuyển sang `confirmed`.

## Endpoints

| Method  | Path                       | Auth             | Mô tả                               |
| ------- | -------------------------- | ---------------- | ----------------------------------- |
| `POST`  | `/payments`                | User             | Tạo Payment cho một Order           |
| `PATCH` | `/payments/:id/confirm`    | Staff/Admin      | Xác nhận Payment thành công         |
| `GET`   | `/payments/order/:orderId` | User/Staff/Admin | Lấy danh sách Payment của một Order |

## Behavior

- **One payment per order**: `POST /payments` kiểm tra `paymentStatus !== pending` — trả về 400 nếu Order đã có Payment đang xử lý.
- **Ownership on create**: User chỉ tạo Payment cho Order của chính mình.
- **Confirm triggers Order transition**: `PATCH /:id/confirm` cập nhật Payment status thành `paid` rồi chuyển Order sang `confirmed` trong cùng một transaction — dùng actor `'system'` để pass state machine.
- **Role restriction**: Confirm chỉ dành cho Staff/Admin (`@Roles(staff, admin)`).

## DTOs

### `CreatePaymentDto`

```ts
orderId:        number   // ID của Order
paymentMethod:  string   // ví dụ: 'bank_transfer', 'cod', 'momo'
transactionId?: string   // mã giao dịch từ cổng thanh toán
```

## Module dependencies

```
PaymentModule
  ├── PrismaModule
  └── OrderModule   (import để resolve OrderService nếu cần; dùng Prisma trực tiếp)
```

## Files

```
src/modules/payment/
├── payment.module.ts
├── payment.controller.ts
├── payment.service.ts
└── dto/
    ├── create-payment.dto.ts
    └── (payment-response.dto.ts — chưa có, dùng Prisma type trực tiếp)
```

## Liên quan

- [Order Module](./order.md) — Payment confirm kéo theo Order lifecycle transition
- [CONTEXT.md](../../CONTEXT.md#thanh-toán) — định nghĩa `Payment` và `PaymentStatus`
