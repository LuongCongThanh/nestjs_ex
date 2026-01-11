# ### ✅ TASK 59: Inventory Alerts & Notifications

> **Task Number:** 59  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Proactive inventory management

**Các bước thực hiện:**

1. Tạo InventoryAlert entity:
   - productId
   - alertType (enum: low_stock, out_of_stock, restock)
   - threshold (trigger when stock <= threshold)
   - recipients (array of emails)
   - isActive
   - lastTriggered
2. Generate module: `nest g module modules/inventory-alerts`
3. Implement InventoryAlertsService:
   - `checkLowStock()` - Run periodically
   - `sendAlert(productId, alertType)`
   - `createAlert(productId, threshold)`
4. Low stock checker:
   - Query products with stock <= threshold
   - Send email to admin/warehouse
   - Create notification
5. Setup cron job:

   ```bash
   npm install @nestjs/schedule
   ```

   ```typescript
   @Cron('0 */6 * * *')  // Every 6 hours
   async checkInventory() { ... }
   ```

6. Email template:
   - Subject: "Low Stock Alert: [Product Name]"
   - Current stock
   - Threshold
   - Product link
   - Reorder suggestion
7. Admin endpoints:
   - GET /inventory/alerts
   - POST /inventory/alerts
   - PATCH /inventory/alerts/:id
8. Optional: SMS alerts via Twilio
9. Dashboard integration:
   - Show low stock products
   - Alert history
10. Test alert triggers

**Kết quả mong đợi:** Never run out of stock unexpectedly

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
