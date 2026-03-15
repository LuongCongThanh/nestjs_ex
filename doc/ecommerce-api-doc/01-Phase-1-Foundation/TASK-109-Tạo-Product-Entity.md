# TASK-00008: Đặc tả Sản phẩm & Quản trị Tồn kho (Product & Inventory Specification)

## 📋 Metadata

- **Task ID**: TASK-00008
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Business Value)
- **Phụ thuộc**: TASK-00007
- **Trạng thái**: ✅ Done

---

## 🎯 PHÂN TÍCH NGHIỆP VỤ (Business Analysis)

### 💡 Tại sao Task này quan trọng?
Sản phẩm (Product) là thực thể trung tâm mang lại doanh thu. Quản trị sản phẩm tốt giúp tối ưu hóa chuyển đổi và trải nghiệm khách hàng.
- **Stock Integrity**: Hệ thống phải kiểm soát chặt chẽ số lượng tồn kho (`stockQuantity`). Việc đặt hàng chỉ được thực hiện khi tồn kho hợp lệ, tránh tình trạng bán quá số lượng (Overselling).
- **Pricing Governance**: Hỗ trợ giá gốc (`price`) và giá khuyến mãi (`comparePrice`). Ràng buộc logic đảm bảo giá khuyến mãi không bao giờ vượt quá giá gốc.
- **SKU Management**: Mỗi sản phẩm phải có một mã định danh thương mại duy nhất (SKU - Stock Keeping Unit) để phục vụ việc tích hợp với các hệ thống kho vận và kế toán.
- **Flexible Metadata**: Sử dụng cột JSONB để lưu trữ các thuộc tính biến động (Size, Color, Material) tùy theo loại sản phẩm mà không cần thay đổi cấu trúc bảng.

---

## 📄 CHI TIẾT THỰC THỂ (Entity Specification)

### 1. Thuộc tính & Ràng buộc (Properties & Constraints)

| Trường | Kiểu dữ liệu | Đặc điểm | Ghi chú |
| :--- | :--- | :--- | :--- |
| **id** | UUID v4 | PK | Định danh nội bộ hệ thống. |
| **sku** | String | Unique, Indexed | Mã định danh thương mại (e.g., "IPHONE-15-PRO-BLK"). |
| **name** | String | Required | Tên sản phẩm chính thức. |
| **slug** | String | UK, Indexed | Chuỗi định danh URL (SEO-friendly). |
| **price** | Decimal (12,2) | Not Null, > 0 | Giá bán thực tế hiện tại. |
| **comparePrice** | Decimal (12,2) | Optional | Giá niêm yết (dùng để hiển thị % giảm giá). |
| **stockQuantity** | Integer | Default: 0 | Số lượng hàng sẵn có trong kho. |
| **isActive** | Boolean | Default: `true` | Trạng thái hiển thị bán hàng. |
| **metadata** | JSONB | Optional | Thông tin kỹ thuật: Cân nặng, Kích thước, Màu... |

### 2. Quan hệ Thực thể (Entity Relationships)
- **N-1 (Category)**: Mỗi sản phẩm thuộc về một danh mục cụ thể.
- **1-N (Media)**: Một sản phẩm có nhiều hình ảnh (Thumbnail được lấy từ ảnh đầu tiên).
- **1-N (OrderItems)**: Lưu vết lịch sử bán hàng.

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Truth)

- [x] **Commercial**: SKU được kiểm tra tính duy nhất trên toàn hệ thống.
- [x] **Inventory**: Tự động chuyển trạng thái sản phẩm sang "Hết hàng" khi `stockQuantity` bằng 0.
- [x] **Search**: SKU và Slug được lập chỉ mục (Indexing) để tối ưu tốc độ tìm kiếm.
- [x] **Relational**: Xóa danh mục cha không làm mất dữ liệu sản phẩm (Soft link logic).

---

## 🧪 TDD Planning (Product Logic)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Price Validation** | Nhập `price: -100` -> Hệ thống từ chối (400 Bad Request). |
| **SKU Duplication Check** | Tạo sản phẩm mới với SKU đã tồn tại -> Trả lỗi Conflict (409). |
| **Discount Logic Integrity** | Nhập `comparePrice` nhỏ hơn `price` -> Hệ thống cảnh báo hoặc điều chỉnh logic hiển thị. |
| **Out of Stock Guard** | Đặt hàng sản phẩm có `stockQuantity = 0` -> Hệ thống báo lỗi "Sản phẩm hiện không còn hàng". |
t manually

**Post-completion:**
- [ ] Update task status to ✅ Done
- [ ] Document any issues or learnings
**Time Tracking:**
- Estimated: ___ hours
- Actual: ___ hours
