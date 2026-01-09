# ### ✅ TASK 57: Discount & Coupon System

> **Task Number:** 57  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Marketing tools, increase sales

**Các bước thực hiện:**

1. Generate module: `nest g resource modules/coupons`
2. Tạo Coupon entity:
   - code (unique, uppercase)
   - type (enum: percentage, fixed_amount)
   - value (số tiền hoặc %)
   - minOrderAmount
   - maxDiscount (cho percentage)
   - usageLimit (số lần sử dụng tối đa)
   - usageCount (đã sử dụng bao nhiêu)
   - startDate, endDate
   - isActive
   - applicableTo (enum: all, category, product)
   - applicableIds (array of IDs)
3. Tạo CouponUsage entity:
   - couponId
   - userId
   - orderId
   - discountAmount
   - usedAt
4. Implement CouponsService:
   - `create()` - Admin only
   - `findAll()` - Admin, với filters
   - `validateCoupon(code, userId, orderAmount)` - Check validity
   - `applyCoupon(code, userId, cart)` - Calculate discount
   - `recordUsage(couponId, userId, orderId)`
5. Validation rules:
   - Check active status
   - Check date range
   - Check usage limit
   - Check min order amount
   - Check user eligibility (one-time per user if needed)
6. Endpoints:
   - POST /coupons (Admin only)
   - GET /coupons (Admin only)
   - GET /coupons/validate?code=XXX (Public/Auth)
   - PATCH /coupons/:id (Admin only)
   - DELETE /coupons/:id (Admin only)
7. Update Order flow:
   - Apply coupon at checkout
   - Store coupon info in order
   - Calculate: subtotal - discount + tax + shipping
8. Create coupon types:
   - Welcome discount (NEW10)
   - Category specific (ELECTRONICS20)
   - Free shipping (FREESHIP)
9. Test coupon scenarios

**Kết quả mong đợi:** Flexible coupon system for promotions

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
