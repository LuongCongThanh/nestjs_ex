# ### ✅ TASK 54: Feature Flags & Config Toggle

> **Task Number:** 54  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Safe feature rollout, A/B testing

**Các bước thực hiện:**

1. Install feature flags library:

   ```bash
   npm install @nestjs/config
   ```

2. Create FeatureFlagsService:
   - Load flags from ENV or database
   - `isEnabled(feature: string): boolean`
3. Define flags:

   ```typescript
   export enum FeatureFlag {
     REVIEWS_ENABLED = "reviews_enabled",
     WISHLIST_ENABLED = "wishlist_enabled",
     PAYMENT_STRIPE = "payment_stripe",
   }
   ```

4. Use in controllers:

   ```typescript
   if (!this.featureFlags.isEnabled("reviews_enabled")) {
     throw new ForbiddenException("Feature not available");
   }
   ```

5. Admin endpoint để toggle features:
   - GET /admin/feature-flags
   - PATCH /admin/feature-flags/:flag
6. Store flags in database hoặc ENV
7. Optional: Integrate LaunchDarkly
8. Test flag toggling

**Kết quả mong đợi:** Gradual rollout, easy rollback

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
