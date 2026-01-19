# 📘 AUTH MODULE – HƯỚNG DẪN API

**Phiên bản:** 4.1 (bám sát code hiện tại)  
**Ngữ cảnh:** NestJS + JWT + Refresh Token lưu DB  
**Prefix mặc định:** `/api/v1` (qua `API_PREFIX`)

---

## Mục lục
1. [Tổng quan & kiến trúc](#1-tổng-quan--kiến-trúc)
2. [Chuẩn response & lỗi](#2-chuẩn-response--lỗi)
3. [Cấu hình & giá trị mặc định](#3-cấu-hình--giá-trị-mặc-định)
4. [Lược đồ CSDL](#4-lược-đồ-csdl)
5. [DTO & validate](#5-dto--validate)
6. [Tài liệu API](#6-tài-liệu-api)
   - [6.1 Đăng ký](#61-post-apiv1authregister--đăng-ký)
   - [6.2 Xác thực email](#62-get-apiv1authverify-email--xác-thực-email)
   - [6.3 Gửi lại email xác thực](#63-post-apiv1authresend-verification--gửi-lại-email-xác-thực)
   - [6.4 Đăng nhập](#64-post-apiv1authlogin--đăng-nhập)
   - [6.5 Làm mới phiên](#65-post-apiv1authrefresh--làm-mới-phiên)
   - [6.6 Đăng xuất](#66-post-apiv1authlogout--đăng-xuất)
   - [6.7 Quên mật khẩu](#67-post-apiv1authforgot-password--quên-mật-khẩu)
   - [6.8 Đặt lại mật khẩu](#68-post-apiv1authreset-password--đặt-lại-mật-khẩu)
   - [6.9 Đổi mật khẩu (có đăng nhập)](#69-post-apiv1authchange-password--đổi-mật-khẩu-có-đăng-nhập)
7. [Mã lỗi tổng hợp](#7-mã-lỗi-tổng-hợp)

---

## 1. Tổng quan & kiến trúc
- **Xác thực email stateless:** JWT (TTL 24h) gửi qua email, không lưu DB.  
- **Phiên đăng nhập stateful:** Refresh Token JWT lưu ở DB dạng băm SHA-256, kèm `userAgent`, `ipAddress`; tối đa **5** phiên / người dùng, tự xóa phiên cũ.  
- **Làm mới có xoay vòng:** Refresh token cũ bị xóa sau khi dùng, token mới được phát hành và lưu lại.  
- **Reset mật khẩu lai:** JWT (truyền) + bảng `password_reset_tokens` (theo dõi hết hạn, đã dùng).  
- **Bảo mật:** Bcrypt salt rounds = 12; bắt buộc email đã xác thực, tài khoản `isActive = true`; kiểm soát tốc độ bằng `@Throttle` trên các endpoint nhạy cảm.  
- **Prefix API:** tất cả route thực tế là `/{API_PREFIX}/auth/...` (mặc định `/api/v1/auth/...`).  

---

## 2. Chuẩn response & lỗi
- **Success wrapper (TransformResponseInterceptor):**
  - Luôn trả về dạng: `{ statusCode, success, message, data? }`.
  - Nếu service đã trả `success` + `message`, interceptor giữ nguyên các trường đó và gắn `statusCode`.
  - Nếu service không có `message`, interceptor thêm `message` mặc định theo route (ví dụ login: `"User logged in successfully"`), và bọc payload vào `data`.
- **Error wrapper (HttpExceptionFilter):**
  - Dạng: `{ statusCode, timestamp, path, method, message, errors? }`.
  - `errors` chỉ có khi lỗi validate trả về mảng.
- **Throttling:** Khi vượt giới hạn, NestJS trả `429 Too Many Requests`.

Ví dụ response thực tế cho login (service không tự set `message` nên payload được bọc vào `data`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "success": true,
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "...", "email": "...", "role": "user", "emailVerified": true, "isActive": true }
  }
}
```

---

## 3. Cấu hình & giá trị mặc định
| Biến môi trường | Vai trò | Mặc định |
| :--- | :--- | :--- |
| `API_PREFIX` | Prefix chung | `api/v1` |
| `JWT_SECRET` | Ký Access Token | bắt buộc |
| `JWT_EXPIRATION` | TTL Access Token | `15m` |
| `JWT_REFRESH_SECRET` | Ký Refresh Token | bắt buộc |
| `JWT_REFRESH_EXPIRATION` | TTL Refresh Token | `30d` |
| `JWT_VERIFICATION_SECRET` | Ký token xác thực email | bắt buộc (TTL cố định 1d) |
| `JWT_RESET_SECRET` | Ký token reset mật khẩu | bắt buộc (TTL cố định 15m) |
| `BACKEND_URL` | Dùng ghép link verify email | `http://localhost:{PORT}` |
| `FRONTEND_URL` | Dùng ghép link reset mật khẩu | bắt buộc để tạo link reset |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP gửi mail | Nếu không đặt sẽ auto tạo tài khoản thử nghiệm Ethereal |

---

## 4. Lược đồ CSDL
### Bảng `users`
| Cột | Kiểu | Mặc định / Ghi chú |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `email` | string (unique, indexed) | lưu lowercase |
| `password` | string | bcrypt hash, bị `@Exclude` khi serialize |
| `firstName` / `lastName` | string | bắt buộc |
| `phone` | string, nullable | - |
| `role` | enum(`user`,`admin`,`staff`) | `user` |
| `isActive` | boolean | `true` |
| `emailVerified` | boolean | `false` |
| `lastLoginAt` | timestamp, nullable | cập nhật khi login |
| `createdAt` / `updatedAt` | timestamp | auto |

### Bảng `refresh_tokens`
| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `token` | string (unique, len 500) | SHA-256 của refresh token |
| `userId` | UUID | FK -> users (cascade delete) |
| `expiresAt` | datetime | từ `exp` của JWT |
| `userAgent` | string, nullable | lưu device |
| `ipAddress` | string, nullable | lưu IP |
| `createdAt` | timestamp | auto |

### Bảng `password_reset_tokens`
| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `token` | string (unique, len 500) | SHA-256 của token reset |
| `userId` | UUID | FK -> users (cascade delete) |
| `expiresAt` | datetime | TTL 15 phút |
| `usedAt` | timestamp, nullable | đánh dấu đã dùng |
| `createdAt` | timestamp | auto |

---

## 5. DTO & validate
- **RegisterDto:** `email` (IsEmail, trim, lowercase), `password` (>=8, có hoa/thường/số/ký tự đặc biệt), `firstName`, `lastName` (không rỗng, trim).
- **LoginDto:** `email` (IsEmail, trim), `password` (bắt buộc).
- **RefreshTokenDto:** `refreshToken` (string, không rỗng).
- **ResendVerificationDto / ForgotPasswordDto:** `email` (IsEmail, trim, lowercase).
- **ResetPasswordDto:** `token` (string), `newPassword` (regex mạnh như Register).
- **ChangePasswordDto:** `oldPassword` (bắt buộc), `newPassword` (regex mạnh như Register).

---

## 6. Tài liệu API
> Ghi chú: `{PREFIX}` = `/{API_PREFIX}` (mặc định `/api/v1`). Các ví dụ dưới đây bỏ qua domain/port để ngắn gọn.

### 6.1 [POST] `{PREFIX}/auth/register` – Đăng ký
- **Chức năng:** Tạo tài khoản mới, trạng thái `isActive=true`, `emailVerified=false`, gửi email xác thực (JWT 24h).  
- **Khai báo (controller):**
```typescript
@Post('register')
@HttpCode(HttpStatus.CREATED)
@Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 req/giờ
async register(@Body() dto: RegisterDto)
```
- **Luồng xử lý:**  
  1) Kiểm tra email đã tồn tại → `409 Conflict`.  
  2) Hash mật khẩu (bcrypt salt 12).  
  3) Lưu user (role mặc định `user`).  
  4) Tạo JWT verify (1 ngày, `type=verify_email`).  
  5) Gửi mail. Nếu gửi lỗi → xóa user vừa tạo, trả `503 ServiceUnavailable`.  
- **Request:** Body JSON gồm `email`, `password`, `firstName`, `lastName`.  
- **Phản hồi thành công (201):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Registration successful. Please check your email for verification."
}
```
- **Lỗi thường gặp:** 400 (validate), 409 (email trùng), 503 (gửi mail lỗi), 429 (quá giới hạn).

### 6.2 [GET] `{PREFIX}/auth/verify-email` – Xác thực email
- **Chức năng:** Kích hoạt tài khoản từ link email.  
- **Khai báo:**
```typescript
@Get('verify-email')
@HttpCode(HttpStatus.OK)
async verifyEmail(@Query('token') token: string)
```
- **Luồng xử lý:**  
  1) Giải mã JWT bằng `JWT_VERIFICATION_SECRET`, kiểm tra `type=verify_email`. Sai/hết hạn → 400.  
  2) Tìm user, nếu không có → 400.  
  3) Nếu đã verified → 400.  
  4) Cập nhật `emailVerified=true`.  
- **Request:** Query `token`.  
- **Phản hồi thành công (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Email verified successfully!"
}
```
- **Lỗi thường gặp:** 400 (token sai/hết hạn/đã xác thực), 429 (nếu bị throttle upstream).

### 6.3 [POST] `{PREFIX}/auth/resend-verification` – Gửi lại email xác thực
- **Chức năng:** Gửi lại link verify.  
- **Khai báo:**
```typescript
@Post('resend-verification')
@HttpCode(HttpStatus.OK)
@Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 req/giờ
async resendVerification(@Body() dto: ResendVerificationDto)
```
- **Luồng xử lý:**  
  1) Tìm user theo email. Nếu không có → vẫn trả success (tránh lộ thông tin).  
  2) Nếu đã verified → trả success với message tương ứng.  
  3) Tạo JWT verify mới, gửi mail; lỗi gửi → `503`.  
- **Request:** Body `email`.  
- **Phản hồi thành công (200):** (tùy trạng thái, đều `success:true`)
  - Email không tồn tại: `"If the account exists, a verification email has been sent."`
  - Đã xác thực: `"Email is already verified."`
  - Chưa xác thực, gửi mail thành công: `"Verification email sent."`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Verification email sent."
}
```
- **Lỗi thường gặp:** 503 (gửi mail lỗi), 429 (giới hạn 3/giờ).

### 6.4 [POST] `{PREFIX}/auth/login` – Đăng nhập
- **Chức năng:** Xác thực người dùng, trả Access Token (ngắn) + Refresh Token (dài, lưu DB). Yêu cầu email đã verify và tài khoản active.  
- **Khai báo:**
```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
@Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 req/5 phút
async login(@Body() dto: LoginDto, @Req() req: Request)
```
- **Luồng xử lý:**  
  1) Tìm user theo email; sai email/pass → `401 Unauthorized`.  
  2) Kiểm tra `isActive`; nếu false → `403 Forbidden`.  
  3) Kiểm tra `emailVerified`; nếu false → `403 Forbidden`.  
  4) Xóa refresh token trùng `userAgent` + `ip` (tránh nhân bản).  
  5) Giới hạn 5 phiên: xóa phiên cũ nhất nếu vượt giới hạn.  
  6) Phát Access Token (TTL `JWT_EXPIRATION`, mặc định 15m) & Refresh Token (TTL `JWT_REFRESH_EXPIRATION`, mặc định 30d); lưu refresh token băm SHA-256 vào DB kèm `userAgent`, `ip`.  
  7) Cập nhật `lastLoginAt`.  
- **Request:** Body `email`, `password`; header `User-Agent` và IP sẽ được lưu.  
- **Phản hồi thành công (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "success": true,
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Thanh",
      "lastName": "Luong",
      "phone": null,
      "role": "user",
      "isActive": true,
      "emailVerified": true,
      "lastLoginAt": "2024-01-19T10:00:00.000Z",
      "createdAt": "2024-01-19T09:00:00.000Z",
      "updatedAt": "2024-01-19T10:00:00.000Z"
    }
  }
}
```
- **Lỗi thường gặp:** 400 (validate), 401 (sai email/pass), 403 (email chưa verify hoặc bị khóa), 429 (quá 5 req/5 phút).

### 6.5 [POST] `{PREFIX}/auth/refresh` – Làm mới phiên
- **Chức năng:** Đổi refresh token hợp lệ lấy cặp access/refresh mới (xoay vòng). Bắt buộc cùng `userAgent` với phiên đã lưu.  
- **Khai báo:**
```typescript
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request)
```
- **Luồng xử lý:**  
  1) Verify chữ ký + hạn refresh token (`JWT_REFRESH_SECRET`); sai → `401`.  
  2) Băm token, đối chiếu DB (kèm user). Không khớp → `401`.  
  3) Nếu user `isActive=false` hoặc `emailVerified=false` → xóa toàn bộ refresh token user đó, trả `401`.  
  4) Nếu `userAgent` lưu trong DB khác `User-Agent` hiện tại → xóa token đó, trả `401`.  
  5) Xóa refresh token đang dùng (rotation).  
  6) Phát access/refresh mới, lưu refresh mới (vẫn giới hạn 5 phiên).  
- **Request:** Body `refreshToken`; header `User-Agent` nên giữ nguyên từ lúc login.  
- **Phản hồi thành công (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "success": true,
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "user": { "id": "uuid", "email": "user@example.com", "role": "user", "emailVerified": true, "isActive": true }
  }
}
```
- **Lỗi thường gặp:** 401 (token sai/hết hạn/không đúng thiết bị/acc bị khóa hoặc chưa verify).

### 6.6 [POST] `{PREFIX}/auth/logout` – Đăng xuất
- **Chức năng:** Thu hồi phiên hiện tại bằng refresh token cung cấp.  
- **Khai báo:**
```typescript
@Post('logout')
@HttpCode(HttpStatus.OK)
async logout(@Body() dto: RefreshTokenDto)
```
- **Luồng xử lý:** Băm refresh token, xóa khỏi DB (không cần kiểm tra chữ ký; nếu token không tồn tại vẫn trả success).  
- **Request:** Body `refreshToken`.  
- **Phản hồi thành công (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Logout successful"
}
```
- **Lỗi thường gặp:** 400 (validate sai trường), 429 (nếu bị limit upstream).

### 6.7 [POST] `{PREFIX}/auth/forgot-password` – Quên mật khẩu
- **Chức năng:** Gửi email chứa link đặt lại mật khẩu.  
- **Khai báo:**
```typescript
@Post('forgot-password')
@HttpCode(HttpStatus.OK)
@Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 req/giờ
async forgotPassword(@Body() dto: ForgotPasswordDto)
```
- **Luồng xử lý:**  
  1) Nếu không tìm thấy email → vẫn trả success (ẩn thông tin).  
  2) Tạo JWT reset (`type=reset_password`, TTL 15m).  
  3) Lưu hash token vào DB với `expiresAt`, `usedAt=null`.  
  4) Gửi mail kèm link `{FRONTEND_URL}/reset-password?token=...`; lỗi gửi → xóa bản ghi và trả `503`.  
- **Request:** Body `email`.  
- **Phản hồi thành công (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Check your email to reset password"
}
```
- **Lỗi thường gặp:** 503 (gửi mail lỗi), 429 (quá 3 req/giờ).

### 6.8 [POST] `{PREFIX}/auth/reset-password` – Đặt lại mật khẩu
- **Chức năng:** Hoàn tất đổi mật khẩu bằng token trong email.  
- **Khai báo:**
```typescript
@Post('reset-password')
@HttpCode(HttpStatus.OK)
async resetPassword(@Body() dto: ResetPasswordDto)
```
- **Luồng xử lý:**  
  1) Verify JWT reset (`JWT_RESET_SECRET`, `type=reset_password`); sai → 400.  
  2) Băm token, tìm bản ghi DB khớp `userId` + chưa hết hạn + `usedAt` rỗng; nếu không có → 400.  
  3) Hash `newPassword` (bcrypt 12), cập nhật user.  
  4) Xóa toàn bộ refresh token của user (buộc đăng nhập lại).  
  5) Đánh dấu `usedAt` cho token hiện tại và xóa các token reset chưa dùng còn lại.  
- **Request:** Body `token`, `newPassword`.  
- **Phản hồi thành công (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password updated successfully!"
}
```
- **Lỗi thường gặp:** 400 (token sai/hết hạn/đã dùng, user không tồn tại).

### 6.9 [POST] `{PREFIX}/auth/change-password` – Đổi mật khẩu (có đăng nhập)
- **Chức năng:** Người dùng đã đăng nhập đổi mật khẩu; sau đó đăng xuất mọi thiết bị.  
- **Khai báo:**
```typescript
@Post('change-password')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async changePassword(@Req() req, @Body() dto: ChangePasswordDto)
```
- **Luồng xử lý:**  
  1) `JwtAuthGuard` kiểm tra Access Token (Bearer).  
  2) So sánh `oldPassword` với DB; sai → `401 Unauthorized` (hoặc 400 từ validate).  
  3) Hash `newPassword` (bcrypt 12), lưu user.  
  4) Xóa tất cả refresh token của user (đăng xuất toàn bộ).  
- **Request:** Header `Authorization: Bearer <accessToken>`; Body `oldPassword`, `newPassword`.  
- **Phản hồi thành công (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password changed successfully"
}
```
- **Lỗi thường gặp:** 400 (validate), 401 (token sai/hết hạn hoặc mật khẩu cũ không đúng).

---

## 7. Mã lỗi tổng hợp
| Mã | Ý nghĩa | Khi nào gặp |
| :--- | :--- | :--- |
| 400 | Bad Request | Token verify/reset sai/hết hạn, validate DTO lỗi, đã verify rồi |
| 401 | Unauthorized | Login sai, refresh token không hợp lệ/khác thiết bị, access token sai/hết hạn, mật khẩu cũ sai |
| 403 | Forbidden | Tài khoản bị khóa (`isActive=false`) hoặc email chưa verify (ở login/refresh) |
| 409 | Conflict | Email đã tồn tại (register) |
| 429 | Too Many Requests | Vượt giới hạn throttling |
| 503 | Service Unavailable | Lỗi gửi email (register, resend, forgot password) |
