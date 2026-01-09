# ### ✅ TASK 27: Order Management

> **Task Number:** 27  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Quản lý đơn hàng

**Các bước thực hiện:**

1. Tạo DTOs:
   - `update-order-status.dto.ts`
   - `order-query.dto.ts`
2. Trong OrdersService:
   - `findAll(query, userId?)` - Admin xem tất cả, User xem của mình
   - `findOne(id, userId?)` - Validation ownership
   - `updateStatus(id, status)` - Admin only
   - `cancelOrder(id, userId)` - User cancel nếu pending
3. Trong OrdersController:
   - GET /orders (My orders hoặc all orders nếu admin)
   - GET /orders/:id
   - PATCH /orders/:id/status (Admin only)
   - PATCH /orders/:id/cancel
4. Apply proper guards

**Kết quả mong đợi:** Quản lý đơn hàng đầy đủ

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
