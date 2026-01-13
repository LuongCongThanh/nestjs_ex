# ### ✅ TASK 46: Reviews & Ratings

> **Task Number:** 46  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Social proof, increase conversion

**Các bước thực hiện:**

1. Generate module: `nest g resource modules/reviews`
2. Tạo Review entity:
   - userId
   - productId
   - rating (1-5)
   - title
   - comment
   - isVerifiedPurchase (boolean)
   - helpfulCount (số người vote helpful)
   - timestamps
3. Update Product entity:
   - averageRating (decimal)
   - reviewCount (integer)
4. Implement ReviewsService:
   - `create()` - Chỉ verified purchasers
   - `findByProduct(productId)`
   - `update()` / `delete()` - Own review only
   - `markHelpful(reviewId)`
5. Endpoints:
   - POST /products/:id/reviews (Auth required)
   - GET /products/:id/reviews (Public, pagination)
   - PATCH /reviews/:id (Own review)
   - DELETE /reviews/:id (Own review or Admin)
6. Update product rating khi có review mới
7. Validate: 1 user = 1 review per product
8. Add Swagger docs

**Kết quả mong đợi:** Customers can review products, build trust

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
