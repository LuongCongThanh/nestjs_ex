# TASK-00011: Quản trị Tiến hóa Cơ sở dữ liệu (Database Evolution Governance)

## 📋 Metadata

- **Task ID**: TASK-00011
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Core Infrastructure)
- **Phụ thuộc**: TASK-00003 (Database Setup)
- **Trạng thái**: ✅ Done

---

## 🎯 PHÂN TÍCH NGHIỆP VỤ (Governance Analysis)

### 💡 Tại sao Task này quan trọng?
Cơ sở dữ liệu là tài sản quan trọng nhất. Việc thay đổi cấu trúc bảng (Schema) cần được quản lý như một phiên bản mã nguồn để đảm bảo tính nhất quán giữa các môi trường (Dev, Staging, Production).
- **Version Control for Schema**: Đảm bảo mọi thay đổi DB đều được lưu vết trong Git, cho phép quay lại (Rollback) bất kỳ thời điểm nào.
- **Environment Parity**: Đảm bảo môi trường Production có cấu trúc giống hệt môi trường Dev, tránh lỗi "Database out of sync".
- **Immutable Migrations**: Một khi migration đã được chạy trên Production, nó trở thành "vượt thời gian" và không bao giờ được chỉnh sửa trực tiếp. Mọi thay đổi mới phải tạo một file migration mới.

---

## 📄 QUY TRÌNH VẬN HÀNH (Operational Workflow)

### 1. Vòng đời Migration (Migration Lifecycle)
Hệ thống tuân thủ quy trình 4 bước:
1. **Phát hiện (Detecting)**: So sánh Entities (định nghĩa trong code) và Schema hiện tại trong DB.
2. **Khởi tạo (Generating)**: Hệ thống tự động trích xuất các câu lệnh SQL thay đổi (DDL).
3. **Kiểm tra (Reviewing)**: Kỹ sư kiểm tra tính an toàn của SQL (đặc biệt là các lệnh DROP hoặc RENAME).
4. **Thực thi (Executing)**: Áp dụng thay đổi vào DB theo mô hình giao dịch (Transactional Execution).

### 2. Chiến lược Rollback (Reversion Strategy)
- Mỗi file Migration phải chứa logic nghịch đảo (`REVERT` logic) để có thể gỡ bỏ thay đổi mà không làm hỏng dữ liệu hiện có.
- Chính sách: Luôn kiểm tra lệnh `down()` trước khi thực thi `up()` trên các môi trường quan trọng.

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Truth)

- [x] **Traceability**: Mọi thay đổi cấu trúc DB đều có thể truy vết qua Git Commit.
- [x] **Synchronization**: Tất cả các máy phát triển (Local) đều có cấu trúc DB đồng nhất sau khi chạy lệnh đồng bộ.
- [x] **Safety**: Có tài liệu hướng dẫn khôi phục dữ liệu nếu migration gặp lỗi giữa chừng.

---

## 🧪 TDD Planning (Ops Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **New Entity Column** | Thêm trường mới vào User Entity -> Migration tự động nhận diện và tạo lệnh `ALTER TABLE`. |
| **Rollback Verification** | Chạy Revert migration vừa xong -> DB phải quay về trạng thái chính xác như trước khi thay đổi. |
| **Production Dry-run** | Kiểm tra script SQL của migration trên bản copy DB production để đảm bảo thời gian chạy không gây downtime lâu. |
