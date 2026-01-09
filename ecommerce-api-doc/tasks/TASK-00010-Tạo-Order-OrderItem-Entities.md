# ### ✅ TASK 10: Tạo Order & OrderItem Entities

> **Task Number:** 10  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Tạo entities cho đơn hàng

**Các bước thực hiện:**

1. Generate module, service, controller cho orders
2. Tạo `order.entity.ts`:
   - id, orderNumber, userId
   - subtotal, tax, shippingFee, total
   - status (enum: pending, confirmed, processing, shipped, delivered, cancelled)
   - paymentStatus (enum: pending, paid, failed, refunded)
   - shippingAddress, city, country, postalCode
   - notes, timestamps
   - @ManyToOne với User
   - @OneToMany với OrderItems (cascade)
3. Tạo `order-item.entity.ts`:
   - id, orderId, productId
   - productName, price, quantity, total
   - @ManyToOne với Order (onDelete: CASCADE)
   - @ManyToOne với Product
4. Import vào OrdersModule

**Kết quả mong đợi:** Đơn hàng lưu trữ đầy đủ thông tin

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
