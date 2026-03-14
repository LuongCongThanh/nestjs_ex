# ### ✅ TASK 13: Tạo Auth DTOs

> **Task Number:** 13  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Validation cho authentication

**Các bước thực hiện:**

1. Tạo folder `src/modules/auth/dto/`
2. Tạo `register.dto.ts`:
   - email (IsEmail)
   - password (MinLength 6)
   - firstName, lastName (IsNotEmpty)
3. Tạo `login.dto.ts`:
   - email (IsEmail)
   - password (IsString)
4. Thêm Swagger decorators (@ApiProperty)
5. Export các DTOs

**Kết quả mong đợi:** Input validation cho auth endpoints

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
