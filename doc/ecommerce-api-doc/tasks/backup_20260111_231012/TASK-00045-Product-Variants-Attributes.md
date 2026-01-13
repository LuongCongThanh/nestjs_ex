# ### ✅ TASK 45: Product Variants & Attributes

> **Task Number:** 45  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Hỗ trợ sản phẩm phức tạp (size, color, etc.)

**Các bước thực hiện:**

1. Generate modules:

   ```bash
   nest g resource modules/product-variants
   nest g resource modules/product-attributes
   ```

2. Tạo ProductAttribute entity:
   - name (e.g., "Color", "Size")
   - values (JSON array: ["Red", "Blue"])
3. Tạo ProductVariant entity:
   - productId
   - sku
   - attributes (JSON: {"color": "Red", "size": "M"})
   - price (có thể khác product price)
   - stock
   - images
4. Update Product entity:
   - hasVariants (boolean)
   - @OneToMany với ProductVariant
5. Update Cart & Order:
   - Link với variantId thay vì productId
   - Store variant info
6. API endpoints:
   - GET /products/:id/variants
   - POST /products/:id/variants (Admin)
   - PATCH /variants/:id (Admin)
7. Update frontend logic để chọn variants

**Kết quả mong đợi:** Support complex products (fashion, electronics)

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
