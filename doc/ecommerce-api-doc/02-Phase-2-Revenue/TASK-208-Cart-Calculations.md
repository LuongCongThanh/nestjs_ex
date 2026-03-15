# TASK-00025: Trí tuệ Thanh toán: Logic Giá cả, Ưu đãi & Thuế (Checkout Intelligence: Pricing, Coupons & Tax Logic)

## 📋 Metadata

- **Task ID**: TASK-00025
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Financial Accuracy)
- **Phụ thuộc**: TASK-00024 (Shopping Persistence)
- **Trạng thái**: ✅ Done

---

## 🎯 CHIẾN LƯỢC TÍNH TOÁN (Calculation Strategy)

### 💡 Tại sao Trí tuệ Thanh toán quan trọng?
Số tiền cuối cùng khách hàng phải trả là cam kết tài chính. Mọi sai sót nhỏ (làm tròn sai, tính thuế thiếu) đều có thể dẫn đến hậu quả pháp lý hoặc mất niềm tin.
- **Precision Arithmetic**: Sử dụng các phương pháp tính toán chính xác tuyệt đối (tránh lỗi dấu phẩy động của Javascript cơ bản).
- **Pricing Invariant**: Đảm bảo giá trị tại thời điểm Checkout không bị thay đổi trong suốt quá trình xử lý đơn hàng.
- **Layered Discounts**: Áp dụng giảm giá theo thứ tự ưu tiên (Giảm giá sản phẩm -> Mã giảm giá toàn sàn -> Phí vận chuyển).

---

## 📄 CẤU TRÚC TÍNH TOÁN CHI TIẾT (Calculation Breakdown)

| Thành phần | Công thức & Quy tắc | Ghi chú Vận hành |
| :--- | :--- | :--- |
| **Subtotal** | `SUM(item_price * quantity)` | Tổng tiền hàng trước thuế. |
| **Tax (VAT)** | `Subtotal * Tax_Rate` | Phụ thuộc vào chính sách thuế hiện hành. |
| **Shipping** | `Base_Rate + Distance_Weight_Fee` | Tính toán dựa trên địa chỉ giao hàng. |
| **Grand Total** | `Subtotal + Tax + Shipping - Discount` | Số tiền thực thu cuối cùng. |

---

## 🏗️ QUY TẮC BẢO VỆ GIÁ (Pricing Protection Rules)

1. **Price Change Lock**: Ngay khi khách hàng bấm vào nút "Tiến hành thanh toán", hệ thống phải tạo một bản sao của giá tại thời điểm đó (Snapshot) để bảo vệ khách hàng khỏi việc tăng giá đột ngột.
2. **Rounding Standard**: Áp dụng chuẩn làm tròn theo quy định tài chính của khu vực (ví dụ: làm tròn đến đơn vị nghìn đồng tại Việt Nam).

---

## ✅ TIÊU CHUẨN ĐÚNG ĐẮN (Definition of Success)

- [x] **Audit Ready**: Mỗi đơn hàng phải lưu trữ chi tiết bảng tính (Breakdown) thay vì chỉ lưu tổng tiền cuối cùng.
- [x] **Idempotent Calculation**: Tính toán lại nhiều lần với cùng dữ liệu đầu vào phải cho ra cùng một kết quả.
- [x] **Zero-Negative Result**: Tổng tiền hàng sau giảm giá không bao giờ được phép nhỏ hơn 0.

---

## 🧪 TDD PLANNING (Calculation Scenarios)

| Kịch bản | Mong đợi |
| :--- | :--- |
| **Complex Discount** | Giảm giá 10% và Voucher 20k -> Hệ thống áp dụng theo đúng thứ tự ưu tiên quy định. |
| **Zero Tax product** | Mặt hàng thuộc diện miễn thuế -> `Tax` phải bằng 0. |
| **Bulk Quantity** | Mua 1000 sản phẩm -> Tổng tiền không bị lỗi tràn số hoặc sai lệch do làm tròn. |
