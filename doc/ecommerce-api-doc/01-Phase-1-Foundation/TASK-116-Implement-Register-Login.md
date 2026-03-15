# TASK-00014: Vòng đời Danh tính: Luồng Đăng ký & Xác thực (Identity Lifecycle: Registration & Authentication Flow)

## 📋 Metadata

- **Task ID**: TASK-00014
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Core Business)
- **Phụ thuộc**: TASK-00013 (Identity Contracts)
- **Trạng thái**: ✅ Done

---

## 🎯 CHIẾN LƯỢC BẢO MẬT DANH TÍNH (Credential Security)

### 💡 Tại sao Luồng này quan trọng?
Đây là điểm chạm đầu tiên và quan trọng nhất về bảo mật. Việc quản lý danh tính không tốt sẽ dẫn đến rò rỉ thông tin người dùng và mất uy tín doanh nghiệp.
- **One-way Cryptography**: Mật khẩu không bao giờ được lưu dưới dạng văn bản thuần (Plaintext). Hệ thống sử dụng cơ chế băm (Hashing) một chiều với độ phức tạp cao (Salted Hashing).
- **Identity Uniqueness**: Đảm bảo một danh tính (Email) chỉ tương ứng với một tài khoản duy nhất, ngăn chặn việc giả mạo hoặc đăng ký chồng chéo.
- **Atomic Registration**: Quá trình tạo User phải hoàn tất 100% trước khi cho phép người dùng thực hiện các hành động tiếp theo.

---

## 📄 QUY TRÌNH NGHIỆP VỤ (Business Flow)

### 1. Luồng Đăng ký (Registration Phase)
| Bước | Hành động | Mục tiêu |
| :--- | :--- | :--- |
| **1. Validate** | Kiểm tra hợp đồng dữ liệu (DTO). | Ngăn chặn rác dữ liệu. |
| **2. Conflict Check** | Kiểm tra Email đã tồn tại trong Hệ thống chưa. | Tránh trùng lặp tài khoản. |
| **3. Secure Hash** | Áp dụng thuật toán băm mật khẩu (Bcrypt/Argon2). | Bảo vệ mật khẩu ngay cả khi lộ DB. |
| **4. Persist** | Lưu trữ thông tin User vào Database. | Khởi tạo danh tính chính thức. |

### 2. Luồng Xác thực (Authentication Phase)
| Bước | Hành động | Mục tiêu |
| :--- | :--- | :--- |
| **1. Identity Lookup** | Tìm kiếm người dùng dựa trên Email. | Xác định tài khoản cần đăng nhập. |
| **2. Secure Compare** | So khớp Hash mật khẩu (Time-constant comparison). | Chống tấn công Timing side-channel. |
| **3. Token Issuance** | Cấp phát JWT (Access Token). | Trao quyền truy cập cho User. |

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Truth)

- [x] **Privacy-by-Design**: Mật khẩu sau khi băm không thể phục hồi lại dạng gốc.
- [x] **Secure Response**: Response trả về cho Client không bao giờ chứa Hash mật khẩu.
- [x] **State Integrity**: User mới tạo mặc định ở trạng thái hợp lệ để có thể Login ngay lập tức (hoặc Pending-verification nếu có).

---

## 🧪 TDD PLANNING (Flow Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Duplicate Email** | Đăng ký với Email đã có trong hệ thống -> Trả lỗi 409 (Conflict). |
| **Wrong Credentials** | Đăng nhập sai mật khẩu -> Trả lỗi 401 chung (Unauthorized) để không lộ lý do sai là Mail hay Pass. |
| **Successful Auth** | Đăng nhập đúng -> Trả về `access_token` hợp lệ và thông tin cơ bản của User. |
