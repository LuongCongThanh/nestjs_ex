# ### ✅ TASK 44: Account Verification & Password Recovery

> **Task Number:** 44  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Complete user authentication flow

**Các bước thực hiện:**

1. Install email service:

   ```bash
   npm install @nestjs-modules/mailer nodemailer
   ```

2. Setup MailerModule với SMTP config
3. Tạo VerificationToken entity:
   - token (UUID)
   - userId
   - type (email_verification, password_reset)
   - expiresAt
4. Email verification flow:
   - POST /auth/register - Send verification email
   - GET /auth/verify-email?token=xxx - Verify email
   - POST /auth/resend-verification
5. Password recovery flow:
   - POST /auth/forgot-password - Send reset email
   - POST /auth/reset-password - Reset với token
6. Token expiry: 24 hours
7. Create email templates (HTML)
8. Test email delivery (use Mailtrap for dev)

**Kết quả mong đợi:** Professional user onboarding flow

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
