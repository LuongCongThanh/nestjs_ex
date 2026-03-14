# ### ✅ TASK 47: Wishlist & Favorites

> **Task Number:** 47  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Giữ chân người dùng, increase conversion

**Các bước thực hiện:**

1. Generate module: `nest g resource modules/wishlist`
2. Tạo WishlistItem entity:
   - userId
   - productId
   - addedAt
   - Unique constraint: (userId, productId)
3. Implement WishlistService:
   - `addToWishlist(userId, productId)`
   - `removeFromWishlist(userId, productId)`
   - `getWishlist(userId)` - Include product details
   - `isInWishlist(userId, productId)`
   - `clearWishlist(userId)`
4. Endpoints:
   - POST /wishlist (Add item)
   - GET /wishlist (My wishlist)
   - DELETE /wishlist/:productId (Remove item)
   - DELETE /wishlist (Clear all)
5. Protect với JwtAuthGuard
6. Optional: Send email when wishlist item on sale
7. Test CRUD operations

**Kết quả mong đợi:** Users can save favorite products

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
