# TASK-00006: Đặc tả Thực thể Người dùng (User & Identity Specification)

## 📋 Metadata

- **Task ID**: TASK-00006
- **Độ ưu tiêu**: 🔴 CHÍ TRỌNG (Security Core)
- **Phụ thuộc**: TASK-00005
- **Trạng thái**: ✅ Done

---

## 🎯 CHIẾN LƯỢC ĐỊNH DANH (Identity Strategy)

### 💡 Tại sao Task này quan trọng?
Thực thể `User` không chỉ lưu thông tin cá nhân, nó là "gốc" của mọi tương tác trong hệ thống. Thiết kế đúng ngay từ đầu giúp bảo vệ quyền riêng tư và ngăn chặn các cuộc tấn công khai thác ID.
- **Security Hardening**: Sử dụng UUID v4 làm Primary Key thay vì Auto-increment để ẩn tổng số lượng người dùng và ngăn chặn tấn công liệt kê (Enumeration Attacks).
- **Privacy by Design**: Áp dụng quy tắc "Blacklist" cho các trường nhạy cảm (như password), đảm bảo chúng không bao giờ xuất hiện trong dữ liệu trả về client.
- **Role Maturity**: Hỗ trợ phân tầng 3 lớp: `USER` (Khách hàng), `STAFF` (Nhân viên), `ADMIN` (Quản trị viên).

---

## 📄 CHI TIẾT THỰC THỂ (Entity Specification)

### 1. Thuộc tính & Ràng buộc (Properties & Constraints)

| Trường | Kiểu dữ liệu | Đặc điểm | Ghi chú |
| :--- | :--- | :--- | :--- |
| **id** | UUID v4 | PK, Unique | Định danh duy nhất toàn cầu. |
| **email** | String | UK, Indexed | Chuẩn hóa lowercase trước khi lưu. |
| **password** | String | Hashed, Private | Không bao giờ trả về API response. |
| **firstName** | String | Required | Tên người dùng. |
| **lastName** | String | Required | Họ người dùng. |
| **phone** | String | Optional | Định dạng số điện thoại quốc tế. |
| **role** | Enum | Default: `USER` | Phân quyền: `USER`, `STAFF`, `ADMIN`. |
| **isActive** | Boolean | Default: `true` | Trạng thái hoạt động của tài khoản. |
| **emailVerified** | Boolean | Default: `false` | Trạng thái xác thực email qua OTP/Link. |

### 2. Quản trị Tài khoản (Account Governance)
- **Auditing**: Mỗi thay đổi thông tin User phải được ghi nhận thời điểm (`updatedAt`).
- **Soft Deletion**: (Tùy chọn Growth) Không xóa hẳn User để giữ tính toàn vẹn của Order history, chỉ chuyển `isActive = false`.

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Done)

- [x] **Privacy**: Trường mật khẩu được định nghĩa là trường nhạy cảm và bị loại trừ khỏi các response mặc định.
- [x] **Integrity**: Email được thiết lập là Unique để tránh trùng lặp tài khoản.
- [x] **Efficiency**: Các trường thường xuyên tìm kiếm (email, isActive) được đánh Index.
- [x] **Access Control**: Ma trận role được tích hợp sẵn vào thực thể.

---

## 🧪 TDD Planning (Identity Logic)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Duplicate Identity** | Cố gắng đăng ký với email cũ -> Hệ thống báo lỗi Conflict (409). |
| **Sensitive Leakage** | Truy vấn thông tin User qua API -> JSON schema không chứa field `password`. |
| **Identity Lookup** | Tìm kiếm User theo Email -> Phải phản hồi ngay lập tức (sử dụng Index). |
| **Authorization Guard** | User với role `USER` cố gắng truy cập Admin Dashboard -> Bị từ chối (403 Forbidden). |
