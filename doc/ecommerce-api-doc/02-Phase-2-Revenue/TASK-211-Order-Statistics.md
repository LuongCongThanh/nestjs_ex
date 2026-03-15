# TASK-00028: Thấu hiểu Kinh doanh: Phân tích Đơn hàng & Báo cáo Doanh thu (Business Insight: Order Analytics & Revenue Reporting)

## 📋 Metadata

- **Task ID**: TASK-00028
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (Management)
- **Phụ thuộc**: TASK-00027 (Order Lifecycle)
- **Trạng thái**: ✅ Done

---

## 🎯 CHIẾN LƯỢC PHÂN TÍCH (Analytics Strategy)

### 💡 Tại sao Thấu hiểu Kinh doanh quan trọng?
Dữ liệu đơn hàng là "xương sống" để đưa ra quyết định kinh doanh. Nếu không có báo cáo, quản trị viên sẽ như người mù đi trong đêm.
- **Decision-Support Architecture**: Hệ thống không chỉ lưu dữ liệu thô mà phải sẵn sàng cung cấp dữ liệu đã tổng hợp (Aggregation) để hỗ trợ ra quyết định nhanh chóng.
- **Near Real-time Reporting**: Đảm bảo các con số doanh thu và biến động đơn hàng được cập nhật với độ trễ thấp nhất.
- **Data Granularity**: Hỗ trợ xem dữ liệu ở nhiều cấp độ (Theo ngày, tuần, tháng, quý hoặc năm).

---

## 📊 CHỈ SỐ HOẠT ĐỘNG CỐT LÕI (Key Performance Indicators)

| Chỉ số (KPI) | Phương pháp Tổng hợp | Ý nghĩa Chiến lược |
| :--- | :--- | :--- |
| **Gross Revenue** | `SUM(grand_total)` của đơn hàng `DELIVERED`. | Tổng doanh thu thực tế. |
| **Order Velocity** | Đếm số đơn hàng theo đơn vị thời gian. | Đo lường sức khỏe của Marketplace. |
| **Conversion Rate** | Tỷ lệ Đơn hàng thành công / Tổng lượt truy cập. | Hiệu quả của phễu bán hàng. |
| **Best Sellers** | Top sản phẩm có số lượng `Committed` cao nhất. | Định hướng nhập hàng & khuyến mãi. |

---

## 🏗️ QUY TẮC QUẢN TRỊ DỮ LIỆU (Data Governance Rules)

### 1. Phân tách Dữ liệu (Temporal Granularity)
- Dữ liệu lịch sử (Historical data) phải được lưu giữ vĩnh viễn cho mục tiêu đối soát tài chính.
- Hệ thống hỗ trợ "Drill-down" từ báo cáo tổng quan xuống chi tiết từng đơn hàng cấu thành nên con số đó.

### 2. Bảo mật Báo cáo (Reporting Access Control)
- Chỉ cấp quyền truy cập dữ liệu thống kê cho vai trò `ADMIN` hoặc `MANAGER`.
- Toàn bộ dữ liệu xuất bản (Export) phải được đánh dấu Timestamp và định danh người xuất.

---

## ✅ TIÊU CHUẨN THÀNH CÔNG (Definition of Success)

- [x] **Data Accuracy**: Con số báo cáo phải khớp 100% với tổng tiền thực thu từ các giao dịch thành công.
- [x] **Performance Optimization**: Các truy vấn thống kê trên tập dữ liệu lớn (> 100k đơn hàng) phải được tối ưu hóa (Index/Materialized Views).
- [x] **Snapshot Consistency**: Báo cáo của quá khứ không bị thay đổi bởi các hành động trong tương lai.

---

## 🧪 TDD PLANNING (Analytics Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Date Range Filter** | Thống kê từ 20/01 đến 25/01 -> Chỉ bao gồm đơn hàng nằm trong khoảng `created_at` đó. |
| **Status Filter** | Thống kê doanh thu tiềm năng -> Chỉ tính toán dựa trên đơn hàng `PAID` và `PROCESSING`. |
| **Zero Data Period** | Thống kê một ngày không có đơn hàng -> Trả về kết quả 0 (không lỗi). |
