# ### ✅ TASK 06: Tạo User Entity

> **Task Number:** 06  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Tạo entity và module cho Users

**Các bước thực hiện:**

1. Generate module: `nest g module modules/users`
2. Generate service: `nest g service modules/users`
3. Generate controller: `nest g controller modules/users`
4. Tạo file `src/modules/users/entities/user.entity.ts`
5. Định nghĩa các fields:
   - id (UUID primary key)
   - email (unique)
   - password (hashed)
   - firstName, lastName
   - phone, address
   - role (enum: admin, user)
   - isActive (boolean)
   - timestamps (createdAt, updatedAt)
6. Thêm decorators: @Entity, @Column, @CreateDateColumn, etc.
7. Thêm @Exclude cho password field
8. Import TypeOrmModule.forFeature([User]) vào UsersModule

**Kết quả mong đợi:** User entity hoàn chỉnh với validation

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
