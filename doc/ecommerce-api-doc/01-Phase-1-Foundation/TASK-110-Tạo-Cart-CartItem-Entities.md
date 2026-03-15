# TASK-00009: Đặc tả Giỏ hàng & Trạng thái Mua sắm (Cart & Persistent Shopping Specification)

## 📋 Metadata

- **Task ID**: TASK-00009
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Customer Experience)
- **Phụ thuộc**: TASK-00008 (Product)
- **Trạng thái**: ✅ Done

---

## 🎯 PHÂN TÍCH NGHIỆP VỤ (Business Analysis)

### 💡 Tại sao Task này quan trọng?
Giỏ hàng (Cart) là cầu nối quan trọng nhất giữa việc tìm kiếm sản phẩm và hành động thanh toán. Quản trị giỏ hàng tốt trực tiếp ảnh hưởng đến tỷ lệ chuyển đổi (Conversion Rate).
- **Persistent Shopping Experience**: Hệ thống hỗ trợ lưu trữ trạng thái mua sắm của cả người dùng đã đăng nhập (User Cart) và khách vãng lai (Guest Cart). Sẵn sàng cơ chế "Merge Cart" khi khách hàng đăng nhập sau khi đã thêm hàng vào giỏ.
- **Price Integrity**: Lưu trữ giá tại thời điểm thêm vào giỏ (`priceAtAdded`). Điều này giúp hệ thống thông báo cho người dùng nếu có sự thay đổi về giá trước khi họ thanh toán.
- **Inventory Soft-Locking**: Mặc dù chưa trừ kho hàng thực tế, hệ thống phải thực hiện validate tồn kho liên tục (Real-time stock check) mỗi khi người dùng thay đổi số lượng trong giỏ hàng.
- **Abandoned Cart Recovery**: Lưu vết thời gian cập nhật cuối cùng để phục vụ các chiến dịch marketing nhắc nhở khách hàng hoàn tất đơn hàng (Abandoned Cart Email).

---

## 📄 CHI TIẾT THỰC THỂ (Entity Specification)

### 1. Thuộc tính & Ràng buộc (Properties & Constraints)

**Thực thể: Cart (Giỏ hàng)**
| Trường | Kiểu dữ liệu | Đặc điểm | Ghi chú |
| :--- | :--- | :--- | :--- |
| **id** | UUID v4 | PK | Định danh giỏ hàng. |
| **userId** | UUID | FK, Nullable | Liên kết với người dùng (Null nếu là khách). |
| **totalItems** | Integer | Calculated | Tổng số lượng Item trong giỏ. |
| **lastActivity** | Timestamp | Indexed | Dùng để xác định giỏ hàng bị bỏ quên. |

**Thực thể: CartItem (Sản phẩm trong giỏ)**
| Trường | Kiểu dữ liệu | Đặc điểm | Ghi chú |
| :--- | :--- | :--- | :--- |
| **id** | UUID v4 | PK | Định danh bản ghi item. |
| **productId** | UUID | FK | Liên kết trực tiếp với sản phẩm. |
| **quantity** | Integer | Min: 1 | Số lượng khách hàng mua. |
| **priceAtAdded** | Decimal | Not Null | Giá ghi nhận tại thời điểm thêm vào giỏ. |

### 2. Quan hệ Thực thể (Entity Relationships)
- **1-1 (User -> Cart)**: Mỗi User chỉ có một giỏ hàng hoạt động tại một thời điểm.
- **1-N (Cart -> CartItems)**: Một giỏ hàng chứa nhiều dòng sản phẩm.
- **N-1 (CartItem -> Product)**: Tham chiếu để lấy thông tin sản phẩm và tồn kho.

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Truth)

- [x] **Stateful**: Giỏ hàng được lưu trữ bền vững trong cơ sở dữ liệu (Database Persistence).
- [x] **Accurate**: Tổng tiền giỏ hàng (Subtotal) được tính toán chính xác bao gồm cả các ràng buộc về tồn kho.
- [x] **Merged**: Items từ giỏ hàng vãng lai được tự động gộp vào giỏ hàng chính thức sau khi đăng nhập.
- [x] **Clean**: Hệ thống có khả năng tự dọn dẹp (Cleanup) các giỏ hàng cũ sau X ngày không hoạt động.

---

## 🧪 TDD Planning (Shopping Logic)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Real-time Stock Check** | Cập nhật số lượng vượt quá tồn kho -> Hệ thống báo lỗi "Vượt quá số lượng có sẵn". |
| **Price Volatility Alert** | Sản phẩm trong giỏ giảm giá -> Hệ thống hiển thị thông báo cập nhật giá mới cho người dùng. |
| **Session Merging** | Thêm 1 SP A khi chưa login -> Login -> Giỏ hàng sau login phải chứa SP A. |
| **Duplicate Prevention** | Thêm 1 SP đã có trong giỏ -> Hệ thống tự động tăng `quantity` thay vì tạo bản ghi mới. |
