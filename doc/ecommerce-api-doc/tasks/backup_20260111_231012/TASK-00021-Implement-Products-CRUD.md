# ### ✅ TASK 21: Implement Products CRUD

> **Task Number:** 21  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Quản lý sản phẩm

**Các bước thực hiện:**

1. Tạo DTOs:
   - `create-product.dto.ts`
   - `update-product.dto.ts`
   - `product-query.dto.ts`
2. Trong ProductsService:
   - `create()` - Auto generate slug
   - `findAll(query)` - With filters, pagination
   - `findOne(id)` - With category relation
   - `update(id, updateDto)`
   - `remove(id)` - Check if in orders
   - `updateStock(id, quantity)`
3. Trong ProductsController:
   - POST /products (Admin only)
   - GET /products (Public with filters)
   - GET /products/:id (Public)
   - PATCH /products/:id (Admin only)
   - DELETE /products/:id (Admin only)
4. Test CRUD operations

**Kết quả mong đợi:** Quản lý sản phẩm hoàn chỉnh

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
