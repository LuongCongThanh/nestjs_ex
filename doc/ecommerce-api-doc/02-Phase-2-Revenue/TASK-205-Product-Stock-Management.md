# TASK-00023: Toàn vẹn Tồn kho: Quản trị Lưu kho & Tính liên tục (Inventory Integrity: Stock Governance & Continuity)

## 📋 Metadata

- **Task ID**: TASK-00023
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Financial Impact)
- **Phụ thuộc**: TASK-00021 (Product Governance)
- **Trạng thái**: ✅ Done

---

## 🎯 CHIẾN LƯỢC TOÀN VẸN TỒN KHO (Stock Integrity Strategy)

### 💡 Tại sao Quản trị Tồn kho quan trọng?
Tồn kho là tài sản. Sai lệch tồn kho dẫn đến mất doanh thu (Hết hàng nhưng vẫn hiện) hoặc gây thất vọng cho khách hàng (Đặt hàng nhưng thực tế đã hết).
- **Atomic Operations**: Mọi thay đổi số lượng phải được thực hiện trong một Transaction để tránh tình trạng Race Condition (2 người cùng mua món hàng cuối cùng).
- **Stock Continuity**: Đảm bảo hệ thống luôn biết chính xác số lượng hàng đang có, hàng đang chờ xử lý và hàng đã bán.
- **Safety Buffers**: Ngăn chặn việc bán quá mức (Overselling) bằng cách thiết lập ngưỡng an toàn.

---

## 📄 QUY TẮC BIẾN ĐỘNG KHO (Stock Movement Rules)

### 1. Phân loại Biến động (Movement Types)
| Loại | Logic Vận hành | Mục tiêu |
| :--- | :--- | :--- |
| **Inbound** | Nhập hàng mới từ NCC. | Tăng số lượng khả dụng. |
| **Reservation** | Giữ hàng khi khách tạo đơn. | Giảm số lượng khả dụng, chưa giảm tổng kho. |
| **Committed** | Hoàn tất thanh toán. | Giảm tổng kho thực tế. |
| **Release** | Hủy đơn hàng. | Hoàn trả số lượng về trạng thái khả dụng. |

### 2. Quản trị Ngưỡng an toàn (Safety Thresholds)
- **Low-stock Alert**: Khi tồn kho xuống dưới X đơn vị, hệ thống tự động gửi thông báo cho quản trị viên.
- **Auto-visibility**: Khi tồn kho = 0, sản phẩm tự động chuyển trạng thái `OUT_OF_STOCK` (TASK-00021).

---

## ✅ TIÊU CHUẨN ĐÚNG ĐẮN (Definition of Success)

- [x] **No Negative Stock**: Hệ thống ngăn chặn tuyệt đối việc số lượng tồn kho trở thành số âm.
- [x] **Transaction Rollback**: Nếu việc tạo đơn hàng thất bại, số lượng tồn kho phải được hoàn trả ngay lập tức.
- [x] **Inventory Audit**: Mọi biến động kho đều phải đi kèm với `reason` (Lý do thay đổi).

---

## 🧪 TDD PLANNING (Inventory Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Concurrent Purchase** | 10 người cùng mua món hàng cuối cùng -> Chỉ 1 người thành công, 9 người nhận thông báo hết hàng. |
| **Return Flow** | Khách trả hàng thành công -> Tồn kho tăng trở lại chính xác số lượng trả. |
| **Bulk Update** | Nhập file Excel tăng kho hàng loạt -> Nếu có 1 dòng sai lỗi, toàn bộ phiên nhập hàng phải Rollback. |
