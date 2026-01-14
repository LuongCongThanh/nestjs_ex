# AUTH_API_SPEC - Tài liệu Đặc tả API Auth (Tiếng Việt)

## Giới thiệu
Tài liệu này cung cấp hướng dẫn chi tiết về việc triển khai module Authentication & Authorization (Xác thực & Phân quyền) trong hệ thống NestJS Ecommerce.

### Mục tiêu
- Xây dựng hệ thống xác thực an toàn theo tiêu chuẩn 2026.
- Đảm bảo tính nhất quán giữa code triển khai và tài liệu Swagger.
- Cung cấp hướng dẫn cho Front-end Integration.

---

## 1. Kiến trúc Hệ thống (Architecture)

### Service Architecture
Module Auth được chia nhỏ thành các service chuyên biệt để đảm bảo tính modular và dễ bảo trì:

1. **AuthService**: Điều phối chính (Register, Login, Refresh Token).
2. **PasswordService**: Quản lý băm và kiểm tra mật khẩu (Bcrypt 12 rounds).
3. **EmailVerificationService**: Quản lý token xác thực email (NEW 2026).
4. **RefreshTokenService**: Quản lý vòng đời refresh token và session.
5. **TokenBlacklistService**: Quản lý các token bị thu hồi (Logout).

---

## 2. Nguyên tắc Thiết kế (Design Principles)

### Tiêu chuẩn Bảo mật 2026
- **Email Verification là Bắt buộc**: Người dùng không thể đăng nhập nếu chưa xác thực email.
- **Không trả về JWT ngay khi đăng ký**: Hệ thống chỉ cấp token sau khi email được xác thực và người dùng đăng nhập thành công.
- **Băm mật khẩu mạnh**: Sử dụng Bcrypt với 12 rounds (thay vì 10).
- **Token Rotation**: Refresh token sẽ được đảo ngược (issue mới và xóa cũ) mỗi khi sử dụng.
- **Silent Success**: Khi thực hiện các tác vụ nhạy cảm như "Resend Link" hoặc "Forgot Password", hệ thống luôn trả về thành công ngay cả khi email không tồn tại để tránh Email Enumeration.

---

## 3. Quy trình Đăng ký & Xác thực (Registration Flow)

### Luồng Hoạt động
1. User gọi `POST /auth/register`.
2. Hệ thống kiểm tra email tồn tại.
3. Tạo user với trạng thái `emailVerified = false`.
4. Tạo token xác thực bảo mật thông qua `EmailVerificationService`.
5. Gửi email chứa link xác thực: `https://app.com/verify-email?token={token}`.
6. Hệ thống trả về thông báo yêu cầu kiểm tra mail (Không trả về access_token).

### API Endpoints
#### [POST] /auth/register
- **Request Body**: `RegisterDto` (email, password, firstName, lastName, phone).
- **Response**: `RegistrationResponseDto`.

#### [GET] /auth/verify-email
- **Query Parameter**: `token` (string).
- **Flow**: Kiểm tra token -> cập nhật `emailVerified: true` -> đánh dấu token đã sử dụng.

#### [POST] /auth/resend-verification-link
- **Request Body**: `ResendVerificationLinkDto` (email).
- **Flow**: Kiểm tra user -> nếu chưa verify thì gửi link mới (vô hiệu hóa link cũ).

---

## 4. Quy trình Đăng nhập (Login Flow)

### Luồng Hoạt động
1. User gọi `POST /auth/login`.
2. Hệ thống kiểm tra credentials.
3. Hệ thống kiểm tra `emailVerified == true`.
4. Nếu hợp lệ, cấp cặp Access Token (ngắn hạn) và Refresh Token (dài hạn).

### API Endpoints
#### [POST] /auth/login
- **Request Body**: `LoginDto` (email, password).
- **Response**: `AuthResponseDto` (user, access_token, refresh_token).

---

## 5. Cấu trúc Response Chuẩn (Response Structure)

Tất cả các API trong module Auth phải tuân thủ định dạng response sau:

### Success Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Mô tả kết quả thành công",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 4xx/5xx,
  "success": false,
  "message": "Thông báo lỗi chi tiết",
  "errorCode": "AUTH_ERROR_CODE",
  "timestamp": "2026-01-14T...",
  "path": "/auth/..."
}
```

---

## 6. Danh sách Mã lỗi (Error Codes)

| Mã lỗi | Mô tả | HTTP Status |
| :--- | :--- | :--- |
| `EMAIL_ALREADY_EXISTS` | Email đã được đăng ký | 409 Conflict |
| `INVALID_CREDENTIALS` | Email hoặc mật khẩu sai | 401 Unauthorized |
| `EMAIL_NOT_VERIFIED` | Email chưa được xác thực | 403 Forbidden |
| `TOKEN_EXPIRED` | Token (JWT/Verification) hết hạn | 401 Unauthorized |
| `ACCOUNT_DISABLED` | Tài khoản bị khóa | 403 Forbidden |

---

## 7. Cấu trúc Database (Schema)

### Bảng User (Cập nhật)
- `emailVerified`: boolean (default: false)
- `isActive`: boolean (default: true)
- `lastLoginAt`: timestamp

### Bảng EmailVerificationToken
- `id`: uuid
- `token`: string (hashed SHA-256)
- `userId`: uuid (relation to User)
- `expiresAt`: timestamp
- `isUsed`: boolean (default: false)
- `createdAt`: timestamp

---

## 8. Hướng dẫn Integration (Front-end)

### Quản lý Access Token
Access Token nên được lưu trong bộ nhớ (memory/state) của ứng dụng để tránh các cuộc tấn công XSS.

### Quản lý Refresh Token
Refresh Token có thể được lưu trong HttpOnly Cookie để đảm bảo an toàn tối đa.

---

*(Lưu ý: Tài liệu này được khôi phục từ bản lưu tạm và có thể thiếu một số phần cuối trang)*
