# TASK-00010: Đặc tả Đơn hàng & Tính toàn vẹn Giao dịch (Order Processing & Transactional Integrity Specification)

## 📋 Metadata

- **Task ID**: TASK-00010
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Revenue & Legal)
- **Phụ thuộc**: TASK-00009 (Cart)
- **Trạng thái**: ✅ Done

---

## 🎯 PHÂN TÍCH NGHIỆP VỤ (Business Analysis)

### 💡 Tại sao Task này quan trọng?
Đơn hàng (Order) không chỉ là một giao dịch, nó là tài liệu pháp lý và tài chính ràng buộc giữa khách hàng và nhà bán hàng.
- **Data Immortality (Snapshot Strategy)**: Thông tin tại thời điểm mua hàng phải được bảo tồn vĩnh viễn. Hệ thống lưu trữ `AddressSnapshot` và `ProductSnapshot` (Tên, SKU, Giá, Thuộc tính) để đảm bảo rằng ngay cả khi sản phẩm gốc bị xóa hoặc thay đổi giá trong tương lai, hóa đơn cũ vẫn hiển thị đúng giữ liệu lịch sử.
- **Transactional Atomic Governance**: Quá trình đặt hàng (Checkout) phải được thực hiện theo nguyên tắc "Tất cả hoặc không là gì". Một lỗi xảy ra ở bất kỳ bước nào (Trừ tồn kho, Tạo Order, Tạo OrderItems, Xóa Giỏ hàng) đều phải khiến toàn bộ quy trình được hoàn trả (Rollback).
- **Workflow State Machine**: Quản trị vòng đời đơn hàng nghiêm ngặt (ví dụ: `PENDING` -> `PAID` -> `SHIPPING` -> `DELIVERED`). Chặn mọi hành động vi phạm logic (ví dụ: Không thể giao hàng nếu đơn hàng chưa được thanh toán hoặc xác nhận).

---

## 📄 CHI TIẾT THỰC THỂ (Entity Specification)

### 1. Thuộc tính & Ràng buộc (Properties & Constraints)

**Thực thể: Order (Đơn hàng)**
| Trường | Kiểu dữ liệu | Đặc điểm | Ghi chú |
| :--- | :--- | :--- | :--- |
| **id** | UUID v4 | PK | Định danh nội bộ. |
| **orderNumber** | String | Unique, Indexed | Mã đơn hàng hiển thị (e.g., ORD-2024-001). |
| **totalAmount** | Decimal | Not Null | Tổng giá trị cuối cùng sau thuế/phí. |
| **status** | Enum | Default: `PENDING` | Trạng thái (Pending, Paid, Cancelled, etc). |
| **addressSnapshot** | JSONB | Required | Lưu địa chỉ giao hàng tại thời điểm mua. |

**Thực thể: OrderItem (Chi tiết đơn hàng)**
| Trường | Kiểu dữ liệu | Đặc điểm | Ghi chú |
| :--- | :--- | :--- | :--- |
| **id** | UUID v4 | PK | Định danh dòng sản phẩm. |
| **productSnapshot** | JSONB | Required | **QUAN TRỌNG**: Lưu Name, SKU, Price lúc mua. |
| **quantity** | Integer | Not Null | Số lượng đã chốt mua. |
| **unitPrice** | Decimal | Not Null | Giá tại thời điểm giao dịch. |

### 2. Quan hệ Thực thể (Entity Relationships)
- **N-1 (User)**: Một người dùng có nhiều đơn hàng.
- **1-N (Order -> OrderItems)**: Một đơn hàng bao gồm nhiều dòng sản phẩm.
- **N-1 (OrderItem -> Product)**: Tham chiếu để phục vụ báo cáo và phân tích sản phẩm (Soft link).

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Truth)

- [x] **Atomic**: Khi trừ kho thất bại, không có đơn hàng "rác" nào được tạo ra.
- [x] **Immutable**: Thay đổi giá sản phẩm ở bảng `Products` không làm ảnh hưởng đến `totalAmount` của các đơn hàng cũ.
- [x] **Sequential**: Đơn hàng tuân thủ đúng quy trình trạng thái đã định nghĩa.
- [x] **Traceable**: Mỗi đơn hàng có một `orderNumber` duy nhất và dễ tra cứu.

---

## 🧪 TDD Planning (Transactional Logic)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Stock Lock Failure** | Một SP trong giỏ hết hàng ngay lúc nhấn mua -> Hệ thống Rollback và báo lỗi cho khách. |
| **Price Stability Test** | Đặt hàng xong -> Admin thay đổi giá SP -> Xem lại đơn hàng, giá tiền vẫn phải giữ nguyên như lúc mua. |
| **Invalid State Transition** | Cố tình cập nhật trạng thái từ `PENDING` sang `DELIVERED` -> Trả lỗi 400 (Bad Request). |
| **Concurrency Safeguard** | Hai khách cùng mua SP cuối cùng -> Chỉ một người thành công, người kia nhận thông báo hết hàng. |
