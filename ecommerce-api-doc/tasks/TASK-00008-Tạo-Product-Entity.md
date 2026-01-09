# ### ✅ TASK 08: Tạo Product Entity

> **Task Number:** 08  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Tạo entity cho Products

**Các bước thực hiện:**

1. Generate module, service, controller cho products
2. Tạo file `product.entity.ts`
3. Định nghĩa fields:
   - id, name, slug
   - description (text)
   - price, comparePrice (decimal)
   - stock (integer)
   - sku, images (array)
   - isActive, isFeatured
   - categoryId
   - timestamps
4. Setup relationships:
   - @ManyToOne với Category
   - @OneToMany với OrderItems
   - @OneToMany với CartItems
5. Import vào ProductsModule

**Kết quả mong đợi:** Product entity đầy đủ thông tin

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
