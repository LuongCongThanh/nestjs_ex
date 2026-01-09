# ### ✅ TASK 49: Order Lifecycle & Event Handling

> **Task Number:** 49  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Decouple business logic, scalability

**Các bước thực hiện:**

1. Install event handling:

   ```bash
   npm install @nestjs/event-emitter
   ```

2. Setup EventEmitterModule trong AppModule
3. Tạo events:
   - `src/modules/orders/events/order-created.event.ts`
   - `order-paid.event.ts`
   - `order-cancelled.event.ts`
   - `order-shipped.event.ts`
4. Emit events trong OrdersService:

   ```typescript
   this.eventEmitter.emit("order.created", new OrderCreatedEvent(order));
   ```

5. Tạo event listeners:
   - `order-created.listener.ts`:
     - Send confirmation email
     - Create notification
   - `order-paid.listener.ts`:
     - Update inventory
     - Trigger shipment process
   - `order-cancelled.listener.ts`:
     - Restore stock
     - Process refund
6. Optional: Upgrade to BullMQ cho background jobs:

   ```bash
   npm install @nestjs/bull bull
   ```

7. Test event flow

**Kết quả mong đợi:** Decoupled, scalable order processing

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
