# TASK-00018: Biến đổi Bảo mật: Quy trình Làm mới Thông tin Xác thực (Security Transformation: Credential Hardening & Change Flow)

## 📋 Metadata

- **Task ID**: TASK-00018
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Security)
- **Phụ thuộc**: TASK-00014 (Auth Flow)
- **Trạng thái**: ✅ Done

---

## 🎯 CHIẾN LƯỢC XOAY VÒNG THÔNG TIN XÁC THỰC (Credential Rotation)

### 💡 Tại sao Quy trình đổi mật khẩu quan trọng?
Mật khẩu là chìa khóa cuối cùng để truy cập tài khoản. Quy trình thay đổi phải cực kỳ chặt chẽ để ngăn chặn kẻ tấn công (đã có Token) không thể chiếm đoạt hoàn toàn tài khoản bằng cách đổi mật khẩu.
- **Verification-First**: Luôn yêu cầu mật khẩu hiện tại (Current Password) trước khi cho phép thiết lập mật khẩu mới.
- **Zero-knowledge on Fail**: Không thông báo lý do cụ thể nếu việc xác minh mật khẩu cũ thất bại để tránh bị dò mật khẩu.
- **Session Termination**: Khi mật khẩu đổi thành công, mọi phiên đăng nhập cũ (Tokens) phải được đánh dấu là không còn hiệu lực.

---

## 📄 QUY TRÌNH XÁC MINH (Verification Chain)

### 1. Luồng Thay đổi Mật khẩu (Change Password Flow)
| Bước | Kiểm tra | Mục tiêu |
| :--- | :--- | :--- |
| **1. Identity Check** | Xác định User qua Token hiện tại. | Đảm bảo đúng chủ sở hữu. |
| **2. Legacy Proof** | So khớp mật khẩu cũ với Hash trong DB. | Chống chiếm đoạt phiên làm việc. |
| **3. Policy Check** | So khớp mật khẩu mới với Quy tắc bảo mật (TASK-00013). | Đảm bảo mật khẩu mới đủ mạnh. |
| **4. Symmetry Check** | So khớp mật khẩu mới và chuỗi xác nhận. | Tránh lỗi nhập liệu từ User. |
| **5. Atomic Update** | Băm mật khẩu mới và cập nhật Database. | Hoàn tất biến đổi bảo mật. |

---

## ✅ TIÊU CHUẨN AN TOÀN (Definition of Success)

- [x] **Secure Update**: Không bao giờ lưu mật khẩu mới dưới dạng plaintext trong bất kỳ log nào.
- [x] **No Side-effects**: Không làm thay đổi các thông tin khác của Profile ngoài Password.
- [x] **Event Logging**: Ghi lại sự kiện "Password Changed" vào nhật ký hệ thống kèm Timestamp và IP.

---

## 🧪 TDD PLANNING (Security Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Incorrect Current Pass** | Nhập sai mật khẩu cũ -> Trả lỗi 401 Unauthorized. |
| **Password Reuse** | Nhập mật khẩu mới giống hệt mật khẩu cũ -> Trả lỗi logic (tùy chính sách doanh nghiệp). |
| **Mismatched Confirm** | Mật khẩu mới và Confirm không khớp -> Trả lỗi validation 400. |
