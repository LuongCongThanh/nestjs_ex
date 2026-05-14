# Cart Module

Quản lý **Cart** (giỏ hàng tạm thời) của từng **User**. Mỗi User có đúng một Cart; Cart bị xoá (items cleared) khi Order được tạo thành công.

## Endpoints

| Method   | Path              | Auth | Mô tả                                               |
| -------- | ----------------- | ---- | --------------------------------------------------- |
| `GET`    | `/cart`           | User | Lấy Cart hiện tại (tự tạo nếu chưa có)              |
| `POST`   | `/cart/items`     | User | Thêm CartItem vào Cart (cộng dồn nếu Product đã có) |
| `PATCH`  | `/cart/items/:id` | User | Cập nhật số lượng CartItem (quantity=0 → xoá)       |
| `DELETE` | `/cart/items/:id` | User | Xoá một CartItem                                    |
| `DELETE` | `/cart`           | User | Xoá toàn bộ CartItem                                |

## Behavior

- **Upsert on add**: `POST /cart/items` với Product đã có trong Cart sẽ cộng thêm quantity, không tạo bản ghi mới.
- **Remove via update**: `PATCH /cart/items/:id` với `quantity: 0` sẽ xoá CartItem thay vì cập nhật.
- **Lazy cart creation**: `GET /cart` và `POST /cart/items` tự tạo Cart nếu User chưa có.
- **Ownership check**: Mọi thao tác với CartItem đều verify CartItem thuộc Cart của User hiện tại.

## DTOs

### `AddCartItemDto`

```ts
productId: number; // ID của Product
quantity: number; // >= 1
```

### `UpdateCartItemDto`

```ts
quantity: number; // >= 0 (0 = xoá)
```

## Module dependencies

```
CartModule
  └── PrismaModule
```

`CartService` được export để `OrderModule` dùng khi tạo Order từ Cart.

## Files

```
src/modules/cart/
├── cart.module.ts
├── cart.controller.ts
├── cart.service.ts
└── dto/
    ├── add-cart-item.dto.ts
    └── update-cart-item.dto.ts
```
