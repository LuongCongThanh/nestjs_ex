# TASK-00016: Quản trị Vòng đời Người dùng & Danh bạ Dự án (User Lifecycle Management & Registry Governance)

## 📋 Metadata

- **Task ID**: TASK-00016
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Operations)
- **Phụ thuộc**: TASK-00006 (User Entity)
- **Trạng thái**: ✅ Done

---

## 🎯 QUẢN TRỊ DANH BẠ (Registry Governance)

### 💡 Tại sao Quản trị User quan trọng?
Hệ thống người dùng là hạt nhân của mọi giao dịch. Việc quản trị không chỉ là CRUD (Thêm, Đọc, Sửa, Xóa) mà là quản lý quyền hạn và tính toàn vẹn của danh tính trong hệ thống.
- **Identity Visibility**: Cung cấp khả năng quan sát toàn diện cho bộ phận vận hành nhưng vẫn đảm bảo quyền riêng tư.
- **Soft-retirement Strategy**: Không bao giờ xóa cứng (Hard Delete) dữ liệu người dùng để bảo toàn lịch sử giao dịch. Thay vào đó, sử dụng trạng thái `Inactive` hoặc `Suspended`.
- **Administrative Guardrails**: Phân tách rõ ràng giữa quyền tự quản trị của người dùng và quyền quản trị tập trung của Admin.

---

## 📄 QUY TRÌNH VẬN HÀNH (Operational Flow)

### 1. Quản trị Hành chính (Admin Operations)
| Hành động | Đặc điểm | Logic nghiệp vụ |
| :--- | :--- | :--- |
| **Audit List** | Read-only | Truy xuất danh sách User kèm phân trang và lọc theo trạng thái. |
| **Identity Lookup** | Precise | Tìm kiếm người dùng qua ID hoặc Email cho mục đích hỗ trợ kỹ thuật. |
| **State Suspension** | Status Update | Tùy chọn khóa tài khoản khi phát hiện vi phạm chính sách. |
| **Role Elevation** | Auth Update | Thay đổi quyền hạn (ví dụ: Nâng cấp từ User lên Staff). |

### 2. Chính sách Nghỉ hưu Danh tính (Identity Retirement)
- Khi có yêu cầu "Xóa", hệ thống đánh dấu User là `Deleted`. 
- Toàn bộ Token hiện có của User đó phải bị vô hiệu hóa ngay lập tức.
- Dữ liệu định danh (Email) có thể được ẩn danh (Anonymized) để tuân thủ quy định bảo vệ dữ liệu (GDPR/NDPR).

---

## ✅ TIÊU CHUẨN VẬN HÀNH (Definition of Success)

- [x] **Data Integrity**: Các đơn hàng cũ của User không bị mất khi User "xóa" tài khoản.
- [x] **Privileged Access**: Chỉ Admin mới có quyền liệt kê toàn bộ người dùng hệ thống.
- [x] **Performance**: Truy vấn tìm kiếm User theo Email phải được tối ưu hóa bằng Index.

---

## 🧪 TDD PLANNING (Operational Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Non-Admin List Access** | User thường cố truy cập API lấy danh sách toàn bộ User -> Trả lỗi 403 Forbidden. |
| **Soft Delete Persistence** | Một User bị xóa vẫn tồn tại trong bảng `Users` nhưng có cờ `deleted_at`. |
| **Email Conflict on Re-reg** | Một Email đã dùng cho tài khoản đang Active -> Không cho phép đăng ký mới. |
