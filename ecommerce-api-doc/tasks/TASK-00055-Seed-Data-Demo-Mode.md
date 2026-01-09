# ### ✅ TASK 55: Seed Data & Demo Mode

> **Task Number:** 55  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Quick setup, demos, testing

**Các bước thực hiện:**

1. Tạo `src/database/seeds/`:
   - `admin-user.seed.ts`
   - `categories.seed.ts`
   - `products.seed.ts`
   - `demo-users.seed.ts`
2. Create SeedService:

   ```typescript
   async seedAll() {
     await this.seedAdminUser();
     await this.seedCategories();
     await this.seedProducts();
   }
   ```

3. Admin user:
   - email: <admin@example.com>
   - password: Admin@123
   - role: admin
4. Sample data:
   - 5-10 categories
   - 50-100 products with images
   - 10 demo users
5. CLI command:

   ```bash
   npm run seed
   npm run seed:reset
   ```

6. Demo mode (optional):
   - Read-only mode
   - Mock payments
   - Auto-reset data daily
7. Add to documentation
8. Test seeding process

**Kết quả mong đợi:** Easy onboarding, quick demos

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
