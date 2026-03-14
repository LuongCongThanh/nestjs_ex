# ### ✅ TASK 16: Implement Users CRUD

> **Task Number:** 16  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Xây dựng API quản lý users

**Các bước thực hiện:**

1. Trong UsersService, implement:
   - `findAll(pagination)` - Get all users with pagination
   - `findOne(id)` - Get user by ID
   - `update(id, updateDto)` - Update user info
   - `remove(id)` - Soft delete user (set isActive = false)
   - `findByEmail(email)` - Helper method
2. Tạo DTOs:
   - `update-user.dto.ts`
   - `user-response.dto.ts`
3. Trong UsersController, tạo routes:
   - GET /users (Admin only)
   - GET /users/:id (Admin hoặc own profile)
   - PATCH /users/:id (Admin hoặc own profile)
   - DELETE /users/:id (Admin only)
4. Apply guards và decorators
5. Test all endpoints

**Kết quả mong đợi:** CRUD hoàn chỉnh cho Users

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
