# ### 💡 TASK 70: Multi-currency Support

> **Task Number:** 70  
> **Priority:** Optional (Advanced)  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Global e-commerce

**Khi nào cần:**
- Sell internationally
- Display prices in local currency

**Các bước thực hiện:**

1. Tạo Currency entity (code, symbol, exchangeRate, isActive)
2. Update Product entity (baseCurrency, basePrice)
3. Currency conversion service
4. Fetch live rates from API (exchangeratesapi.io, fixer.io)
5. Update prices dynamically based on user's currency
6. Store orders in original currency
7. Admin settings for exchange rates
8. Currency selector in UI

**Kết quả mong đợi:** Support global customers

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
