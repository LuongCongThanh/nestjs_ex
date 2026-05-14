# Order Module

Quản lý vòng đời của **Order** — từ khi tạo ra từ **Cart** đến khi delivered hoặc refunded. Giá và địa chỉ được chụp lại (snapshot) tại thời điểm đặt hàng và không thay đổi sau đó.

## Endpoints

| Method  | Path                 | Auth             | Mô tả                                        |
| ------- | -------------------- | ---------------- | -------------------------------------------- |
| `POST`  | `/orders`            | User             | Tạo Order từ Cart hiện tại                   |
| `GET`   | `/orders`            | User/Staff/Admin | Lấy danh sách Order (User chỉ thấy của mình) |
| `GET`   | `/orders/:id`        | User/Staff/Admin | Chi tiết một Order                           |
| `PATCH` | `/orders/:id/status` | User/Staff/Admin | Cập nhật OrderStatus                         |

## Order Lifecycle

```
pending ──(system, sau Payment)──► confirmed
confirmed ──(staff)──► processing ──(staff)──► shipped ──(staff)──► delivered
pending/confirmed ──(user/staff)──► cancelled ──(staff)──► refunded
```

Logic chuyển trạng thái được tập trung tại `order-transitions.util.ts` — không nằm rải rác trong service. Xem [CONTEXT.md](../../CONTEXT.md#order-lifecycle) để biết đầy đủ các ràng buộc.

## Behavior

- **Cart → Order**: `POST /orders` snapshot giá từng CartItem, tạo OrderItem tương ứng, rồi xoá toàn bộ CartItem trong một transaction.
- **Ownership**: User chỉ thấy Order của chính mình; Staff/Admin thấy tất cả.
- **Status guard**: `PATCH /:id/status` gọi `canTransition(from, to, actor)` — trả về 400 nếu chuyển trạng thái không hợp lệ.
- **System transitions**: `pending → confirmed` chỉ do `PaymentService` trigger với actor `'system'`, không phải endpoint này.

## DTOs

### `CreateOrderDto`

```ts
shippingAddress: Record<string, unknown>  // ShippingAddressSnapshot
notes?:          string                    // max 500 ký tự
```

### `UpdateOrderStatusDto`

```ts
status:        OrderStatus   // trạng thái mới
cancelReason?: string        // bắt buộc khi status = cancelled, max 500 ký tự
```

## Module dependencies

```
OrderModule
  ├── PrismaModule
  └── CartModule   (dùng CartService để clear Cart khi tạo Order)
```

`OrderService` được export để `PaymentModule` dùng khi confirm Payment.

## Files

```
src/modules/order/
├── order.module.ts
├── order.controller.ts
├── order.service.ts
├── order-transitions.util.ts      ← state machine thuần (testable)
├── order-transitions.util.spec.ts
└── dto/
    ├── create-order.dto.ts
    └── update-order-status.dto.ts
```
