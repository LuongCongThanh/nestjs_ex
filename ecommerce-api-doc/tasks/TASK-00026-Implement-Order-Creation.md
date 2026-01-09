# ### ✅ TASK 26: Implement Order Creation

> **Task Number:** 26  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Tạo đơn hàng từ giỏ hàng

**Các bước thực hiện:**

1. Tạo DTOs:
   - `create-order.dto.ts`:
     - shippingAddress, city, country, postalCode
     - notes
2. Trong OrdersService:
   - `create(userId, createOrderDto)`:
     - Get cart items
     - Validate stock availability
     - Generate order number (ORD-YYYYMMDD-XXXX)
     - Create order with items
     - Decrease product stock
     - Clear cart
     - Use transaction
3. POST /orders endpoint
4. Return order with items
5. Test order creation flow

**Kết quả mong đợi:** User đặt hàng thành công

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
