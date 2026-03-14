# ### ✅ TASK 61: Admin Dashboard & Statistics

> **Task Number:** 61  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Business insights and analytics

**Các bước thực hiện:**

1. Generate module: `nest g module modules/dashboard`
2. Generate service: `nest g service modules/dashboard`
3. Implement DashboardService với methods:
   - `getOverview()`:
     - Total revenue (today, week, month, year)
     - Total orders
     - Total customers
     - Total products
   - `getRevenueChart(startDate, endDate)`:
     - Daily/weekly/monthly revenue
     - Format for charts
   - `getTopProducts(limit)`:
     - Best sellers
     - By revenue or quantity
   - `getTopCategories(limit)`
   - `getOrdersByStatus()`:
     - Count by status
   - `getCustomerGrowth()`:
     - New customers per period
   - `getLowStockProducts(threshold)`
   - `getRecentOrders(limit)`
   - `getAverageOrderValue()`
   - `getConversionRate()`:
     - Orders / Total visitors
4. Use QueryBuilder với aggregations:

   ```typescript
   .select('SUM(total)', 'revenue')
   .addSelect('COUNT(*)', 'orderCount')
   .groupBy('DATE(created_at)')
   ```

5. Endpoints (Admin only):
   - GET /dashboard/overview
   - GET /dashboard/revenue?period=month
   - GET /dashboard/top-products
   - GET /dashboard/top-categories
   - GET /dashboard/orders-by-status
   - GET /dashboard/customer-growth
6. Cache dashboard data (5-15 minutes)
7. Export functionality:
   - Export to CSV/Excel
   - Date range filters
8. Optional: Real-time updates với WebSocket
9. Test dashboard queries performance

**Kết quả mong đợi:** Comprehensive admin dashboard for business insights

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
