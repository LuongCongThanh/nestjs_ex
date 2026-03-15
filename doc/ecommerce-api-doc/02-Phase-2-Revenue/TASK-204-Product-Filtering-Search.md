# TASK-00022: Khám phá Thị trường: Kiến trúc Tìm kiếm & Điều hướng (Marketplace Discovery: Search & Navigation Architecture)

## 📋 Metadata

- **Task ID**: TASK-00022
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (User Experience)
- **Phụ thuộc**: TASK-00021 (Product Governance)
- **Trạng thái**: ✅ Done

---

## 🎯 CHIẾN LƯỢC KHÁM PHÁ (Discovery Strategy)

### 💡 Tại sao Tìm kiếm & Bộ lọc quan trọng?
Một hệ thống Marketplace với hàng ngàn sản phẩm sẽ trở nên vô dụng nếu người dùng không thể tìm thấy thứ họ muốn trong < 3 giây.
- **Precision vs Recall**: Cân bằng giữa việc tìm đúng từ khóa và việc gợi ý các sản phẩm liên quan.
- **Faceted Navigation**: Cho phép người dùng thu hẹp kết quả dựa trên nhiều tiêu chí (Giá, Thương hiệu, Phân loại) một cách đồng thời.
- **Zero-result Handling**: Chiến lược gợi ý khi không tìm thấy kết quả chính xác để giữ chân người dùng.

---

## 📄 QUY TẮC TÌM KIẾM & PHÂN LOẠI (Search & Ranking Rules)

### 1. Tham số Tìm kiếm (Discovery Parameters)
| Tham số | Logic Xử lý | Mục tiêu Vận hành |
| :--- | :--- | :--- |
| **Full-text Search** | Tìm danh mục, tên & mô tả sản phẩm. | Khám phá dựa trên từ khóa. |
| **Price Range** | Lọc theo `min_price` and `max_price`. | Phù hợp ngân sách khách hàng. |
| **Category Filter** | Lọc theo ID danh mục (bao gồm cả con). | Điều hướng theo phân loại. |
| **Visibility** | Chỉ hiện sản phẩm `ACTIVE`. | Bảo vệ trải nghiệm mua sắm. |

### 2. Chiến lược Sắp xếp (Ranking Strategy)
- **Featured First**: Ưu tiên các sản phẩm được đánh dấu `is_featured`.
- **New Arrivals**: Sắp xếp theo ngày tạo giảm dần.
- **Price Elasticity**: Sắp xếp theo giá tăng/giảm dần.

---

## 🏗️ HẠ TẦNG PHÂN TRANG (Pagination Infrastructure)

Để đảm bảo hiệu năng khi dữ liệu lớn, hệ thống áp dụng tiêu chuẩn:
- **Limit-Offset Paging**: Phù hợp cho điều hướng trang đơn giản (1, 2, 3...).
- **Metadata Response**: Luôn trả về tổng số bản ghi (`total`), số trang (`totalPages`) và trang hiện tại để Frontend hiển thị thanh điều hướng.

---

## ✅ TIÊU CHUẨN HIỆU NĂNG (Definition of Success)

- [x] **Sub-second Response**: Các truy vấn tìm kiếm cơ bản phải hoàn thành dưới 500ms.
- [x] **Relational Filter**: Lọc theo danh mục cha phải tự động bao gồm cả sản phẩm của danh mục con.
- [x] **Sanitized Inputs**: Mọi từ khóa tìm kiếm phải được khử khuẩn để chống SQL Injection.

---

## 🧪 TDD PLANNING (Discovery Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Deep Link Search** | Tìm kiếm với từ khóa nằm trong mô tả sản phẩm -> Phải xuất hiện kết quả hợp lệ. |
| **Price Filter Conflict** | `min_price` > `max_price` -> Hệ thống tự động đảo ngược hoặc trả kết quả rỗng (không lỗi). |
| **Invalid Category** | Lọc theo một Category ID không tồn tại -> Trả về mảng rỗng `[]` kèm thông tin phân trang mặc định. |
