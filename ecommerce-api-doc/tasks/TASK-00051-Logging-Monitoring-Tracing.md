# ### ✅ TASK 51: Logging, Monitoring & Tracing

> **Task Number:** 51  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Observability for production debugging

**Các bước thực hiện:**

1. Install Winston:

   ```bash
   npm install winston winston-daily-rotate-file nest-winston
   ```

2. Configure Winston logger:
   - Log levels: error, warn, info, debug
   - Daily rotate files
   - JSON format
3. Implement correlation ID:
   - Generate unique request ID
   - Add to all logs
   - Return in response header
4. Create LoggingInterceptor:
   - Log all requests/responses
   - Include duration, status
5. Structured logging:

   ```typescript
   logger.info("Order created", {
     orderId,
     userId,
     amount,
     correlationId,
   });
   ```

6. Optional: Integrate external services:
   - Sentry (error tracking)
   - Prometheus (metrics)
   - Grafana (visualization)
7. Add health check endpoint:
   - GET /health (database, redis status)
8. Monitor key metrics:
   - Request duration
   - Error rate
   - Database query time

**Kết quả mong đợi:** Easy production debugging, proactive monitoring

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
