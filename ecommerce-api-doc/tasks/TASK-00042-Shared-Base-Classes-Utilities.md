# ### ✅ TASK 42: Shared Base Classes & Utilities

> **Task Number:** 42  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Tránh lặp code, DRY principle

**Các bước thực hiện:**

1. Tạo `src/common/entities/base.entity.ts`:

   ```typescript
   @Entity()
   export abstract class BaseEntity {
     @PrimaryGeneratedColumn("uuid")
     id: string;

     @CreateDateColumn()
     createdAt: Date;

     @UpdateDateColumn()
     updatedAt: Date;

     @DeleteDateColumn()
     deletedAt?: Date;
   }
   ```

2. Tạo `src/common/dto/pagination.dto.ts`
3. Tạo `src/common/dto/paginated-response.dto.ts`
4. Tạo `src/common/repositories/base.repository.ts`
5. Update tất cả entities extend BaseEntity
6. Create utility functions:
   - slugify()
   - generateOrderNumber()
   - formatCurrency()

**Kết quả mong đợi:** Code DRY, consistent, reusable

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
