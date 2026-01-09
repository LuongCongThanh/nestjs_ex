# ### ✅ TASK 43: Refresh Token & Session Management

> **Task Number:** 43  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Authentication an toàn, user experience tốt hơn

**Các bước thực hiện:**

1. Tạo RefreshToken entity:
   - token (hashed)
   - userId
   - expiresAt
   - isRevoked
2. Update AuthService:
   - `generateTokens()` - Return access + refresh token
   - Access token: 15 phút
   - Refresh token: 7-30 ngày
3. Implement endpoints:
   - POST /auth/refresh - Refresh access token
   - POST /auth/logout - Revoke refresh token
   - POST /auth/logout-all - Revoke all user's tokens
4. Lưu refresh token vào database (hashed)
5. Validate refresh token khi refresh
6. Auto cleanup expired tokens (cron job)
7. Test token rotation

**Kết quả mong đợi:** Secure session management, better UX

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
