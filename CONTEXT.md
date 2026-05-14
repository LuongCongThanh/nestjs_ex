# E-Commerce API

Hệ thống backend cho một nền tảng thương mại điện tử — quản lý danh mục sản phẩm, giỏ hàng, đơn hàng và thanh toán.

## Language

### Người dùng & Tài khoản

**User**:
Người dùng hệ thống — vừa là tài khoản xác thực, vừa là khách mua hàng. Không tồn tại khái niệm "Customer" riêng biệt.
_Avoid_: Customer, Client, Buyer, Account

**UserRole**:
Vai trò của User trong hệ thống: `user` (người mua), `staff` (nhân viên vận hành), `admin` (quản trị viên).
_Avoid_: Permission, Access level

**Address**:
Địa chỉ giao hàng thuộc về một User. Một User có thể có nhiều Address; một Address có thể được đánh dấu là mặc định.
_Avoid_: Location, Shipping address (dùng khi chỉ nói đến khái niệm chung)

### Danh mục & Sản phẩm

**Category**:
Nhóm phân loại sản phẩm theo cấu trúc cây (cha–con). Một Category có thể chứa nhiều Category con.
_Avoid_: Tag, Group, Collection

**Product**:
Mặt hàng được bán trên sàn. Thuộc về một Category. Có thể bị ẩn (soft-delete) mà không xoá khỏi DB.
_Avoid_: Item, Good, Merchandise

### Giỏ hàng

**Cart**:
Giỏ hàng tạm thời của một User — tập hợp các Product User định mua. Bị xoá ngay khi Order được tạo thành công.
_Avoid_: Basket, Bag

**CartItem**:
Một dòng trong Cart: một Product kèm số lượng. Chưa xác nhận mua — có thể thay đổi bất cứ lúc nào.
_Avoid_: Cart line, Cart entry

### Đơn hàng

**Order**:
Cam kết mua hàng được tạo từ Cart. Bất biến sau khi tạo — giá và địa chỉ giao hàng được chụp lại tại thời điểm đặt.
_Avoid_: Purchase, Transaction, Request

**OrderItem**:
Một dòng trong Order: một Product kèm giá tại thời điểm đặt hàng (price snapshot). Không thay đổi sau khi Order được tạo.
_Avoid_: Order line, Line item

**OrderStatus**:
Trạng thái hiện tại của Order trong vòng đời xử lý. Xem **Order Lifecycle** bên dưới.

**ShippingAddressSnapshot**:
Bản chụp địa chỉ giao hàng tại thời điểm đặt Order. Độc lập với Address gốc — thay đổi Address sau này không ảnh hưởng đến Order cũ.
_Avoid_: Delivery address (dùng khi chỉ nói đến khái niệm chung)

### Thanh toán

**Payment**:
Giao dịch tài chính gắn với một Order. Ghi nhận phương thức thanh toán, mã giao dịch và trạng thái.
_Avoid_: Transaction (quá chung), Charge

**PaymentStatus**:
Trạng thái của Payment: `pending`, `completed`, `failed`, `refunded`.

## Order Lifecycle

```
pending ──(Payment thành công, tự động)──► confirmed
confirmed ──(staff)──► processing ──(staff)──► shipped ──(staff)──► delivered
confirmed ──(User hoặc staff)──► cancelled ──(staff hoàn tiền thủ công)──► refunded
pending   ──(User hoặc staff)──► cancelled
```

- **pending**: Order vừa tạo, chờ thanh toán.
- **confirmed**: Payment thành công — hệ thống tự chuyển.
- **processing / shipped / delivered**: Staff cập nhật thủ công theo tiến trình xử lý kho và giao vận.
- **cancelled**: User tự huỷ (chỉ khi `pending` hoặc `confirmed`); staff có thể huỷ bất kỳ lúc nào trước `shipped`.
- **refunded**: Staff xử lý hoàn tiền thủ công sau khi Order đã `cancelled` và đã thanh toán.

## Relationships

- Một **User** có nhiều **Address**, nhiều **Order**, một **Cart**
- Một **Cart** có nhiều **CartItem**; bị xoá khi **Order** được tạo thành công
- Một **Order** có nhiều **OrderItem** và một **Payment**
- Một **OrderItem** chụp lại giá của **Product** tại thời điểm đặt hàng
- Một **Product** thuộc về một **Category**; **Category** có cấu trúc cây (cha–con)

## Example dialogue

> **Dev:** "Khi User cập nhật Address, Order cũ có bị ảnh hưởng không?"
> **Domain expert:** "Không — Order lưu **ShippingAddressSnapshot**, không tham chiếu trực tiếp vào Address. Thay đổi Address sau này hoàn toàn độc lập."

> **Dev:** "Nếu User huỷ Order đang ở `processing`, tiền có tự hoàn không?"
> **Domain expert:** "Không — User không được huỷ khi đã `processing`. Chỉ staff mới can thiệp, và **refunded** là bước staff cập nhật thủ công sau khi đã xử lý hoàn tiền bên ngoài hệ thống."

## Flagged ambiguities

- "Customer" đã được dùng trong một số tài liệu cũ — đã thống nhất: không có khái niệm Customer riêng, dùng **User** cho tất cả.
