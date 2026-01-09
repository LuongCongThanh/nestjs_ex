# ### ✅ TASK 14: Implement Register & Login

> **Task Number:** 14  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Xây dựng chức năng đăng ký và đăng nhập

**Các bước thực hiện:**

1. Trong AuthService, tạo method `register()`:
   - Check email đã tồn tại chưa
   - Hash password với bcrypt (10 rounds)
   - Tạo user mới trong database
   - Return user (exclude password)
2. Tạo method `login()`:
   - Tìm user theo email
   - Verify password với bcrypt.compare
   - Generate JWT token
   - Return { access_token, user }
3. Trong AuthController:
   - POST /auth/register
   - POST /auth/login
4. Thêm Swagger documentation cho endpoints
5. Test với Postman hoặc Swagger UI

**Kết quả mong đợi:** User có thể đăng ký và đăng nhập

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
