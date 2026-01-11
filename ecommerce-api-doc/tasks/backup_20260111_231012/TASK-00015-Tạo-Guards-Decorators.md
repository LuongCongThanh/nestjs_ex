# ### ✅ TASK 15: Tạo Guards & Decorators

> **Task Number:** 15  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Bảo vệ routes với guards

**Các bước thực hiện:**

1. Tạo `jwt-auth.guard.ts`:
   - Extend AuthGuard('jwt')
2. Tạo `roles.guard.ts`:
   - Implement CanActivate
   - Check user roles từ metadata
3. Tạo `roles.decorator.ts`:
   - SetMetadata decorator cho roles
4. Tạo `get-user.decorator.ts`:
   - Extract user từ request
5. Test guards trên các protected routes

**Kết quả mong đợi:** Routes được bảo vệ với JWT và roles

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
