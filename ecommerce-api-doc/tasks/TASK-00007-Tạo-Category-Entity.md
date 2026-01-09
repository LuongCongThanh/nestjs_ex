# ### ✅ TASK 07: Tạo Category Entity

> **Task Number:** 07  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Tạo entity cho Categories với nested structure

**Các bước thực hiện:**

1. Generate module, service, controller cho categories
2. Tạo file `category.entity.ts`
3. Định nghĩa fields:
   - id, name, slug
   - description, image
   - parentId (self-referencing)
   - isActive
   - timestamps
4. Setup relationships:
   - @ManyToOne với parent
   - @OneToMany với children
   - @OneToMany với products
5. Import vào CategoriesModule

**Kết quả mong đợi:** Category entity hỗ trợ cây danh mục nhiều cấp

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
