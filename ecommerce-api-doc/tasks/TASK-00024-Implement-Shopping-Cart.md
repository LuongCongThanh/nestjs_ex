# ### ✅ TASK 24: Implement Shopping Cart

> **Task Number:** 24  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Giỏ hàng của người dùng

**Các bước thực hiện:**

1. Tạo DTOs:
   - `add-to-cart.dto.ts` (productId, quantity)
   - `update-cart-item.dto.ts` (quantity)
2. Trong CartsService:
   - `getOrCreateCart(userId)` - Tự động tạo cart
   - `addItem(userId, productId, quantity)`
   - `updateItem(userId, itemId, quantity)`
   - `removeItem(userId, itemId)`
   - `clearCart(userId)`
   - `getCartWithItems(userId)` - Include products, calculate total
3. Trong CartsController:
   - GET /carts/my-cart
   - POST /carts/items
   - PATCH /carts/items/:id
   - DELETE /carts/items/:id
   - DELETE /carts/clear
4. Protect all routes với JwtAuthGuard

**Kết quả mong đợi:** User quản lý giỏ hàng

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
