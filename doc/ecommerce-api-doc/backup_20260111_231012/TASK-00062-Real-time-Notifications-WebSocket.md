# ### ✅ TASK 62: Real-time Notifications (WebSocket)

> **Task Number:** 62  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Live updates and notifications

**Các bước thực hiện:**

1. Install WebSocket dependencies:

   ```bash
   npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
   ```

2. Generate gateway: `nest g gateway modules/notifications`
3. Setup NotificationsGateway:

   ```typescript
   @WebSocketGateway({ cors: true })
   export class NotificationsGateway {
     @WebSocketServer()
     server: Server;
   }
   ```

4. Tạo Notification entity:
   - userId
   - type (enum: order_status, low_stock, new_review, promotion)
   - title
   - message
   - data (JSON)
   - isRead
   - createdAt
5. Implement NotificationsService:
   - `create(userId, notification)`
   - `findByUser(userId, unreadOnly?)`
   - `markAsRead(notificationId)`
   - `markAllAsRead(userId)`
   - `delete(notificationId)`
   - `sendRealtime(userId, notification)` - Emit via WebSocket
6. WebSocket events:
   - Client: `connection`, `disconnect`, `joinRoom`
   - Server: `notification`, `orderUpdate`, `messageReceived`
7. JWT authentication cho WebSocket:

   ```typescript
   @UseGuards(WsJwtGuard)
   handleConnection(client: Socket) { ... }
   ```

8. Notification triggers:
   - Order status changed → Notify customer
   - Low stock → Notify admin
   - New review → Notify admin
   - Payment received → Notify admin
   - Product back in stock → Notify users on waitlist
9. Endpoints (REST):
   - GET /notifications (My notifications)
   - PATCH /notifications/:id/read
   - PATCH /notifications/mark-all-read
   - DELETE /notifications/:id
10. Frontend integration:
    - Connect to WebSocket
    - Listen for events
    - Show toast/notification
    - Update notification bell badge
11. Fallback: If WebSocket unavailable, use polling
12. Test real-time delivery

**Kết quả mong đợi:** Real-time user engagement and updates

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
