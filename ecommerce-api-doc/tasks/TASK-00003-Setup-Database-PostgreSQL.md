# ### ✅ TASK 03: Setup Database PostgreSQL

> **Task Number:** 03  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Cài đặt và cấu hình PostgreSQL

**Các bước thực hiện:**

1. Cài đặt PostgreSQL (nếu chưa có):
   - Mac: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`
   - Windows: Download installer từ postgresql.org
2. Khởi động PostgreSQL service
3. Tạo database mới: `createdb ecommerce_db`
4. Tạo user (nếu cần):

   ```sql
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO your_user;
   ```

5. Test connection bằng psql hoặc pgAdmin

**Kết quả mong đợi:** PostgreSQL database đã sẵn sàng để kết nối

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
