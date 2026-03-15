# TASK-00007: Đặc tả Danh mục sản phẩm (Category & Hierarchy Specification)

## 📋 Metadata

- **Task ID**: TASK-00007
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Catalog Foundation)
- **Phụ thuộc**: TASK-00005
- **Trạng thái**: ✅ Done

---

## 🎯 PHÂN TÍCH NGHIỆP VỤ (Business Analysis)

### 💡 Tại sao Task này quan trọng?
Danh mục (Category) không đơn thuần là một cái tên, nó là cấu trúc xương sống giúp khách hàng tìm kiếm sản phẩm (Product Discovery).
- **SEO Mastery**: Hệ thống tự động tạo `slug` (URL-friendly) từ tên danh mục. Việc duy trì tính Unique của slug là bắt buộc để tối ưu hóa thứ hạng tìm kiếm (Google SEO).
- **Infinite Hierarchy**: Hỗ trợ mô hình tự tham chiếu (Self-referencing), cho phép tạo cây thư mục không giới hạn cấp (ví dụ: Điện máy -> Gia dụng -> Nhà bếp).
- **Relational Integrity**: Đảm bảo rằng khi một danh mục bị xóa, các sản phẩm liên quan không bị "mồ côi" (Orphaned) thông qua cơ chế Soft Delete.

---

## 📄 CHI TIẾT THỰC THỂ (Entity Specification)

### 1. Thuộc tính & Ràng buộc (Properties & Constraints)

| Trường | Kiểu dữ liệu | Đặc điểm | Ghi chú |
| :--- | :--- | :--- | :--- |
| **id** | UUID v4 | PK | Định danh duy nhất. |
| **name** | String | Required, Unique | Tên danh mục hiển thị (e.g., "Điện thoại"). |
| **slug** | String | UK, Indexed | Chuỗi định danh URL (e.g., "dien-thoai"). |
| **description** | Text | Optional | Mô tả ngắn về danh mục. |
| **image** | String (Url) | Optional | Ảnh đại diện cho danh mục. |
| **parentId** | UUID | FK | Trỏ về danh mục cha (mối quan hệ 1-N). |
| **isActive** | Boolean | Default: `true` | Trạng thái hiển thị trên giao diện người dùng. |

### 2. Quan hệ Thực thể (Entity Relationships)
- **N-1 (Self)**: Nhiều danh mục con thuộc về 1 danh mục cha.
- **1-N (Products)**: Một danh mục có thể chứa nhiều sản phẩm.

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Truth)

- [x] **Hierarchy**: Hỗ trợ truy vấn dữ liệu theo cấu trúc cây (Nested JSON).
- [x] **SEO**: Slugs được sinh tự động và duy nhất.
- [x] **Validation**: Ngăn chặn tuyệt đối vòng lặp (Circular Dependency) - một danh mục không thể làm con của chính nó.
- [x] **Access Control**: Chỉ người dùng có quyền `ADMIN` hoặc `STAFF` mới được phép thao tác chỉnh sửa danh mục.

---

## 🧪 TDD Planning (Category Logic)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Auto Slug Generation** | Input Name: "Đồ Gia Dụng" -> Output Slug: "do-gia-dung". |
| **Circular Link Prevention** | Gán `parentId` bằng chính `id` của nó -> Hệ thống báo lỗi Validation (400). |
| **Nested Discovery** | Truy vấn danh mục gốc -> Phải trả về danh sách kèm theo các danh mục con bên trong. |
| **Soft Delete Guard** | Xóa danh mục cha -> Các danh mục con phải được xử lý (ẩn đi hoặc chuyển parent) để tránh lỗi dữ liệu. |
