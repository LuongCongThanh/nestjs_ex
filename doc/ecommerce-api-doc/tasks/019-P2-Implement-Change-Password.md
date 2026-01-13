# ### ✅ TASK 18: Implement Change Password

> **Task Number:** 18  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** User đổi mật khẩu

**Các bước thực hiện:**

1. Tạo `change-password.dto.ts`:
   - currentPassword
   - newPassword
   - confirmPassword
2. Trong UsersService, tạo `changePassword()`:
   - Verify current password
   - Hash new password
   - Update database
3. POST /users/change-password endpoint
4. Protect với JwtAuthGuard
5. Test flow đổi password

**Kết quả mong đợi:** User đổi được mật khẩu an toàn

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
