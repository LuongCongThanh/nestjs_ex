# ### 💡 TASK 71: Social Login (OAuth)

> **Task Number:** 71  
> **Priority:** Optional (Advanced)  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Easy onboarding, reduce friction

**Khi nào cần:**
- Improve conversion rate
- Simplify registration

**Các bước thực hiện:**

1. Install Passport strategies: `npm install passport-google-oauth20 passport-facebook`
2. Setup OAuth apps (Google Cloud Console, Facebook Developers)
3. Create strategies (GoogleStrategy, FacebookStrategy)
4. Implement auth flow (redirect to provider, handle callback)
5. Create or link user account
6. Issue JWT token
7. Handle edge cases (email exists, merge accounts)
8. Store provider info
9. Optional: GitHub, Twitter/X, Apple Sign In

**Kết quả mong đợi:** Easy social login

---

## 📝 Implementation Notes

**⚠️ Note:** This is an optional advanced feature. Only implement after completing core tasks (1-65).

**Pre-requisites:**
- [ ] Review if this feature is needed for your use case
- [ ] Ensure core features are stable
- [ ] Check team capacity and timeline

**Implementation Checklist:**
- [ ] Research best practices for this feature
- [ ] Complete all steps listed above
- [ ] Write comprehensive tests
- [ ] Document architecture decisions
- [ ] Consider scaling implications
- [ ] Performance testing

**Post-completion:**
- [ ] Update task status to ✅ Done
- [ ] Document implementation details
- [ ] Share learnings with team
- [ ] Monitor feature usage and performance

**Time Tracking:**
- Estimated: 1-2 weeks
- Actual: ___ hours

**When to implement:**
- After MVP is complete and stable
- When business requirements demand it
- When scaling to enterprise level
