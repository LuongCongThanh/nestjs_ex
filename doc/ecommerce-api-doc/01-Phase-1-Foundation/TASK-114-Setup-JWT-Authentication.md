# TASK-00012: Kiến trúc & Quản trị JWT (JWT Architecture & Governance)

## 📋 Metadata

- **Task ID**: TASK-00012
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Security)
- **Phụ thuộc**: TASK-00002 (Security Framework)
- **Trạng thái**: ✅ Done

---

## 🎯 KIẾN TRÚC XÁC THỰC (Authentication Architecture)

### 💡 Tại sao Token-based Auth quan trọng?
Hệ thống sử dụng JSON Web Token (JWT) để thực hiện xác thực không trạng thái (Stateless Authentication), giúp quy mô hóa hệ thống dễ dàng và tăng tính bảo mật cho API.
- **Identity Decoupling**: Tách biệt quá trình đăng nhập và quá trình truy cập tài nguyên.
- **Payload Standards**: Token chứa thông tin định danh tối thiểu (sub, email, roles) để giảm tải truy vấn Database trong mỗi request.
- **Exchanged Security**: Sử dụng chữ ký số (Digital Signature) để đảm bảo Token không bị giả mạo khi truyền qua môi trường mạng.

---

## 🔐 CHÍNH SÁCH VẬN HÀNH (Governance Policies)

### 1. Chính sách cấp phát (Issuance Policy)
- **Thuật toán ký**: HS256 (HMAC with SHA-256) hoặc RS256 tùy theo yêu cầu mở rộng (hiện tại ưu tiên HS256).
- **Thời hạn (TTL)**: 
    - `Access Token`: Ngắn (ví dụ: 1 giờ) để giảm thiểu rủi ro khi bị lộ.
    - `Refresh Token` (nếu có): Dài (ví dụ: 7 ngày) để duy trì phiên làm việc.
- **Secret Management**: Khóa bí mật (JWT_SECRET) phải được lưu trữ trong biến môi trường và có chính sách xoay vòng (Rotation) định kỳ.

### 2. Chiến lược Xác thực (Validation Strategy)
- **Fail-fast Validation**: Mỗi Request kèm Token sẽ được kiểm tra chữ ký và thời hạn ngay lập tức tại tầng Middleware/Guard.
- **Identity Verification**: Sau khi giải mã thành công, hệ thống phải đảm bảo User ID trong Token vẫn tồn tại và ở trạng thái "Active" trong cơ sở dữ liệu.

---

## ✅ TIÊU CHUẨN AN TOÀN (Definition of Done)

- [x] **Secure Metadata**: Token không chứa thông tin nhạy cảm (Password, API Keys).
- [x] **Tamper-proof**: Mọi cố gắng chỉnh sửa Payload của Token đều dẫn đến lỗi xác thực 401.
- [x] **Stateless**: Server không cần lưu trữ Session trong Memory, giúp hệ thống dễ dàng scale ngang.

---

## 🏗️ KỊCH BẢN KIỂM THỬ (Security Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Expired Token** | Sử dụng Token đã hết hạn truy cập API -> Trả về lỗi `401 Unauthorized`. |
| **Signature Tampering** | Chỉnh sửa một ký tự trong chữ ký Token -> Hệ thống từ chối xác thực. |
| **Identity Invalidation** | User bị xóa/khóa trong DB nhưng vẫn dùng Token cũ -> Chặn truy cập ngay lần validate tiếp theo. |
