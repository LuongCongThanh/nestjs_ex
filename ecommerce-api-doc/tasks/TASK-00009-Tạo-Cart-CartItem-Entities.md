# ### ✅ TASK 09: Tạo Cart & CartItem Entities

> **Task Number:** 09  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Tạo entities cho giỏ hàng

**Các bước thực hiện:**

1. Generate module, service, controller cho carts
2. Tạo `cart.entity.ts`:
   - id, userId
   - isActive
   - timestamps
   - @ManyToOne với User
   - @OneToMany với CartItems
3. Tạo `cart-item.entity.ts`:
   - id, cartId, productId
   - quantity
   - timestamps
   - @ManyToOne với Cart
   - @ManyToOne với Product
4. Import cả 2 entities vào CartsModule

**Kết quả mong đợi:** Giỏ hàng có thể chứa nhiều sản phẩm

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
