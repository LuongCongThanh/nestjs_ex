# ### ✅ TASK 4.5: Setup Global Validation & Error Handling

> **Task Number:** 4.5  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Cấu hình validation và error handling ngay từ đầu

**Các bước thực hiện:**

1. Cấu hình ValidationPipe globally trong `main.ts`:

   ```typescript
   app.useGlobalPipes(
     new ValidationPipe({
       whitelist: true, // Strip properties không có trong DTO
       forbidNonWhitelisted: true, // Throw error nếu có extra fields
       transform: true, // Auto transform types
       transformOptions: {
         enableImplicitConversion: true,
       },
     })
   );
   ```

2. Tạo custom validation decorators trong `src/common/decorators/`:
   - `@IsStrongPassword()` - Password strength
   - `@IsPhoneNumber()` - Phone validation
   - `@IsSlug()` - Slug format
3. Tạo `src/common/filters/http-exception.filter.ts` (basic version):
   - Catch HttpException
   - Format response nhất quán
   - Log errors
4. Apply globally:

   ```typescript
   app.useGlobalFilters(new HttpExceptionFilter());
   ```

5. Tạo common DTOs:
   - `src/common/dto/pagination.dto.ts`
   - `src/common/dto/id-param.dto.ts`
6. Test validation với invalid inputs

**Kết quả mong đợi:** Validation & error handling hoạt động từ đầu project

**⚠️ Lưu ý:** Task này quan trọng - làm sớm giúp tránh refactor sau

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
