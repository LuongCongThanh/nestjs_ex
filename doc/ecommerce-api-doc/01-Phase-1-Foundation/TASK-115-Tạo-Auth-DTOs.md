# TASK-00013: Định nghĩa Hợp đồng Danh tính & Tiêu chuẩn Xác thực (Identity Contracts & Validation Standards)

## 📋 Metadata

- **Task ID**: TASK-00012
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Governance)
- **Phụ thuộc**: TASK-00012 (JWT Architecture)
- **Trạng thái**: ✅ Done

---

## 🎯 HỢP ĐỒNG DỮ LIỆU (Identity Contracts)

### 💡 Tại sao Validation quan trọng?
Việc xác thực dữ liệu đầu vào (Input Validation) là tuyến phòng thủ đầu tiên chống lại các cuộc tấn công SQL Injection, XSS và rò rò rỉ dữ liệu. Hệ thống định nghĩa các "Hợp đồng" (Contracts) nghiêm ngặt cho mỗi hành động xác thực.
- **Fail-fast Principle**: Từ chối dữ liệu không hợp lệ ngay tại cổng vào (Request Pipeline) trước khi chạm tới Business Logic hoặc Database.
- **Sanitization Governance**: Đảm bảo dữ liệu như Email luôn được đưa về dạng chuẩn (lowercase, trimmed) để tránh trùng lặp tài khoản.

---

## 📄 QUY TẮC XÁC THỰC (Validation Rules)

### 1. Luồng Đăng ký (Register Contract)
| Trường | Quy tắc bắt buộc | Mục tiêu bảo mật |
| :--- | :--- | :--- |
| **Email** | Valid Email Format, Unique | Chống spam và trùng lặp danh tính. |
| **Password** | Min 8 chars, chữ hoa, chữ thường, số | Chống tấn công Brute-force. |
| **FirstName / LastName** | String, Max 50 chars | Ngăn chặn Buffer Overflow (giả định) và giữ sạch DB. |

### 2. Luồng Đăng nhập (Login Contract)
- **Email**: Bắt buộc, định dạng email.
- **Password**: Bắt buộc, dạng chuỗi (không kiểm tra độ phức tạp ở bước này để tránh lộ thông tin account tồn tại).

---

## ✅ TIÊU CHUẨN ĐẦU RA (Definition of Success)

- [x] **Transparent Errors**: Trả về thông báo lỗi chi tiết và dễ hiểu cho từng trường dữ liệu không hợp lệ.
- [x] **Schema Compliance**: Mọi request `POST /auth/*` đều phải tuân thủ đúng cấu trúc JSON đã quy định.
- [x] **Swagger-ready**: Các hợp đồng dữ liệu được mô tả rõ ràng để các bên FE có thể tích hợp chính xác.

---

## 🧪 TDD PLANNING (Validation Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Weak Password** | Đăng ký với pass "123" -> Trả lỗi 400 (Bad Request) kèm lý do độ phức tạp. |
| **Invalid Email** | Nhập email "abc.com" -> Hệ thống từ chối ngay lập tức. |
| **Missing Fields** | Gửi request thiếu trường `lastName` -> Trả lỗi xác thực chi tiết trường bị thiếu. |
