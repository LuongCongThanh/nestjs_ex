# ### ✅ TASK 05: Thiết kế Database Schema

> **Task Number:** 05  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Lên kế hoạch cấu trúc database

**Các bước thực hiện:**

1. Phân tích yêu cầu nghiệp vụ e-commerce
2. Xác định các entities chính:
   - Users (Người dùng)
   - Categories (Danh mục)
   - Products (Sản phẩm)
   - Carts (Giỏ hàng)
   - Orders (Đơn hàng)
   - OrderItems (Chi tiết đơn hàng)
   - CartItems (Chi tiết giỏ hàng)
3. Vẽ ERD (Entity Relationship Diagram)
4. Xác định relationships:
   - User 1-N Orders
   - User 1-N Carts
   - Category 1-N Products
   - Product N-N Orders (through OrderItems)
   - Product N-N Carts (through CartItems)
5. Xác định các trường, kiểu dữ liệu, constraints

**Kết quả mong đợi:** Database schema rõ ràng, đầy đủ

---

## 📝 Implementation Notes

**Pre-requisites:**
- [ ] Review task requirements carefully
- [ ] Check dependencies on other tasks
- [ ] Setup development environment

**Implementation Checklist:**
- [ ] Complete all steps listed above
- [ ] Write unit tests
- [ ] Write integration tests (if applicable)
- [ ] Update API documentation (Swagger)
- [ ] Code review
- [ ] Test manually

**Post-completion:**
- [ ] Update task status to ✅ Done
- [ ] Document any issues or learnings
- [ ] Commit and push changes

**Time Tracking:**
- Estimated: ___ hours
- Actual: ___ hours
