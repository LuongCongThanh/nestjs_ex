# ### ✅ TASK 63: Two-Factor Authentication (2FA)

> **Task Number:** 63  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Enhanced account security

**Các bước thực hiện:**

1. Install 2FA libraries:

   ```bash
   npm install speakeasy qrcode
   npm install -D @types/speakeasy @types/qrcode
   ```

2. Update User entity:
   - twoFactorSecret (encrypted)
   - twoFactorEnabled (boolean)
   - twoFactorBackupCodes (array)
3. Implement 2FA methods trong AuthService:
   - `generateTwoFactorSecret(userId)`:
     - Generate secret với speakeasy
     - Generate QR code
     - Return secret + QR code URL
   - `enableTwoFactor(userId, token)`:
     - Verify token
     - Save secret to user
     - Generate backup codes
   - `verifyTwoFactor(userId, token)`:
     - Verify with speakeasy
   - `disableTwoFactor(userId, password)`
   - `regenerateBackupCodes(userId)`
4. Update login flow:
   - Step 1: Username + password
   - Step 2 (if 2FA enabled): Verify 2FA token
   - Issue JWT only after 2FA verified
5. Endpoints:
   - POST /auth/2fa/generate - Get QR code
   - POST /auth/2fa/enable - Enable 2FA
   - POST /auth/2fa/verify - Verify during login
   - POST /auth/2fa/disable - Disable 2FA
   - POST /auth/2fa/backup-codes - Regenerate codes
6. Backup codes:
   - Generate 10 one-time codes
   - User can use if lost phone
   - Mark as used after usage
7. 2FA app support:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
8. Admin enforcement:
   - Optional: Force 2FA for admin accounts
9. Rate limiting cho 2FA attempts
10. Test 2FA flow thoroughly

**Kết quả mong đợi:** Bank-level security for user accounts

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
