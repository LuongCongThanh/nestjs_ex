# TASK-00017: Quyền Sở hữu Danh tính & Quản trị Hồ sơ (Identity Ownership & Profile Governance)

## 📋 Metadata

- **Task ID**: TASK-00017
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (User Experience)
- **Phụ thuộc**: TASK-00016 (User Lifecycle)
- **Trạng thái**: ✅ Done

---

## 🎯 QUYỀN TỰ QUẢN TRỊ (Self-Service Management)

### 💡 Tại sao Profile Management quan trọng?
Người dùng phải có quyền kiểm soát thông tin cá nhân của họ. Điều này không chỉ tăng trải nghiệm người dùng mà còn là yêu cầu pháp lý về bảo vệ dữ liệu cá nhân.
- **Identity Ownership**: User là người sở hữu dữ liệu của mình và có quyền xem/cập nhật các thông tin không nhạy cảm.
- **Privacy by Design**: Hệ thống tự động lọc bỏ các trường dữ liệu nhạy cảm (Password, Roles, Internal Flags) khi trả về thông tin hồ sơ.
- **Access Context**: Thông tin hồ sơ được truy xuất dựa trên Identity Context (Token) hiện tại, đảm bảo User A không bao giờ xem được Profile của User B qua các endpoint cá nhân.

---

## 📄 QUY TẮC DỮ LIỆU (Data Governance)

### 1. Phân loại thuộc tính (Field Classification)
Hệ thống phân chia rõ ràng các loại thông tin để áp dụng chính sách cập nhật tương ứng:
- **Thông tin cập nhật được (Mutable)**: `firstName`, `lastName`, `phoneNumber`, `address`.
- **Thông tin bất biến/Hạn chế (Immutable/Internal)**: `email` (thay đổi qua luồng Verify riêng), `role` (chỉ Admin), `password` (qua luồng Security riêng).

### 2. Chính sách truy cập (Access Policy)
- **Read**: Truy xuất thông tin định danh tối thiểu để hiển thị giao diện người dùng.
- **Update**: Chỉ cho phép cập nhật các thuộc tính nằm trong danh sách "Mutable".

---

## ✅ TIÊU CHUẨN XÁC THỰC (Definition of Success)

- [x] **Secure Context**: Endpoint `/me` luôn trả về đúng dữ liệu của Token đang đăng nhập.
- [x] **Data Sanitation**: Response Profile không bao giờ rò rỉ Hash mật khẩu.
- [x] **Validation**: Mọi cập nhật hồ sơ đều phải tuân thủ quy tắc validation đã định nghĩa ở TASK-00013.

---

## 🧪 TDD PLANNING (Privacy Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Cross-profile Access** | User A cố gọi API `/users/profile/{UserB_ID}` -> Trả lỗi 403 (nếu không phải Admin). |
| **Sensitive Leakage** | Kiểm tra Response của `/me` -> Đảm bảo trường `password` hoàn toàn vắng mặt. |
| **Role Escalation Attempt** | User cố gửi request update `role: "ADMIN"` -> Hệ thống phớt lờ hoặc báo lỗi, không cập nhật DB. |
