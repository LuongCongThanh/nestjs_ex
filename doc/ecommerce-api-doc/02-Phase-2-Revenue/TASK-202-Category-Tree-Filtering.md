# TASK-00020: Khám phá Phân cấp: Cây Danh mục & Lọc Nâng cao (Hierarchical Discovery: Category Tree & Advanced Filtering)

## 📋 Metadata

- **Task ID**: TASK-00020
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (Discovery)
- **Phụ thuộc**: TASK-00019 (Category Governance)
- **Trạng thái**: ✅ Done

---

## 🎯 CHIẾN LƯỢC KHÁM PHÁ PHÂN LOẠI (Taxonomy Navigation)

### 💡 Tại sao Cây Danh mục quan trọng?
Người dùng thường bắt đầu hành trình mua sắm từ việc duyệt danh mục. Một cấu trúc cây rõ ràng và khả năng lọc linh hoạt giúp giảm "ma sát" (Friction) khi tìm kiếm sản phẩm.
- **Recursive Discovery**: Khả năng tự động mở rộng và thu hẹp các cấp độ danh mục mà không làm gián đoạn trải nghiệm người dùng.
- **Structural Integrity**: Đảm bảo mỗi danh mục con luôn được định vị chính xác dưới danh mục cha, tạo nên một bản đồ phân loại nhất quán.
- **Visibility Governance**: Kiểm soát việc hiển thị danh mục dựa trên trạng thái (Active/Inactive) và sự tồn tại của sản phẩm thực tế.

---

## 📄 QUY TẮC TRUY XUẤT & LỌC (Filtering & Discovery Rules)

### 1. Cơ chế Xây dựng Cây (Tree Construction)
Hệ thống sử dụng thuật toán đệ quy hoặc tối ưu hóa truy vấn (như Materialized Path/Nested Set - nếu cần) để xây dựng cấu trúc lồng nhau:
- **Root-level Extraction**: Lấy các danh mục gốc làm điểm khởi đầu.
- **Depth Control**: Giới hạn độ sâu truy xuất nếu cây danh mục quá lớn để tối ưu hiệu năng.

### 2. Quản trị Bộ lọc (Filtering Governance)
| Bộ lọc | Logic thực hiện | Ý nghĩa vận hành |
| :--- | :--- | :--- |
| **Active Only** | `status == ACTIVE` | Chỉ hiển thị các danh mục đang sẵn sàng kinh doanh. |
| **Parent Root** | `parent_id == NULL` | Lấy danh sách danh mục cấp cao nhất cho thanh điều hướng chính. |
| **Sub-branch** | `parent_id == {ID}` | Cho phép xem sâu vào một nhánh cụ thể. |

---

## ✅ TIÊU CHUẨN TRẢI NGHIỆM (Definition of Success)

- [x] **Lightweight Tree**: Cấu trúc JSON trả về phải tối ưu, lược bỏ các trường không cần thiết cho UI.
- [x] **Consistent Navigation**: Slugs và IDs trong cây danh mục phải trùng khớp tuyệt đối với dữ liệu thực tế.
- [x] **Cached Performance**: Cây danh mục nên được Cache để phản hồi tức thì vì tần suất thay đổi là rất thấp.

---

## 🧪 TDD PLANNING (Discovery Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Empty Tree Branch** | Một danh mục cha không có con -> `children` trả về mảng rỗng `[]` (không phải error). |
| **Inactive Filter** | Truy xuất cây danh mục với `?active=true` -> Phải loại bỏ hoàn toàn các danh mục bị ẩn và các nhánh con của chúng. |
| **Deep Link Accuracy** | Truy cập danh mục qua Slug -> Trả về thông tin danh mục kèm theo danh sách các danh mục con trực tiếp. |
