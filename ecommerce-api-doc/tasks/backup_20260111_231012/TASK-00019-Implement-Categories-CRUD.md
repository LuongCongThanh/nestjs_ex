# ### ✅ TASK 19: Implement Categories CRUD

> **Task Number:** 19  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Quản lý danh mục sản phẩm

**Các bước thực hiện:**

1. Tạo DTOs:
   - `create-category.dto.ts`
   - `update-category.dto.ts`
2. Trong CategoriesService:
   - `create()` - Auto generate slug
   - `findAll()` - Get all với tree structure option
   - `findOne(id)`
   - `update(id, updateDto)`
   - `remove(id)` - Check if has products
   - `findBySlug(slug)`
3. Trong CategoriesController:
   - POST /categories (Admin only)
   - GET /categories (Public)
   - GET /categories/:id (Public)
   - PATCH /categories/:id (Admin only)
   - DELETE /categories/:id (Admin only)
4. Implement nested categories logic
5. Test với Postman

**Kết quả mong đợi:** Quản lý danh mục nhiều cấp

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
