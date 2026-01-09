# ### ✅ TASK 48: Payment Integration (Advanced)

> **Task Number:** 48  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Secure, reliable payment processing

**Các bước thực hiện:**

1. **Choose payment provider:**
   - **Stripe** (International) - Recommended
   - VNPay (Vietnam)
   - PayPal
   - Razorpay (India)
2. **Install Stripe SDK:**

   ```bash
   npm install stripe
   npm install -D @types/stripe
   ```

3. **Generate module:** `nest g resource modules/payments`
4. **Setup Stripe configuration:**

   ```typescript
   // .env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PUBLIC_KEY=pk_test_...

   // Configure StripeModule
   StripeModule.forRoot({
     apiKey: process.env.STRIPE_SECRET_KEY,
     apiVersion: '2023-10-16',
   });
   ```

5. **Tạo Payment entity:**

   ```typescript
   - id (UUID)
   - orderId (reference)
   - userId
   - provider (enum: stripe, vnpay, paypal)
   - amount (decimal)
   - currency (USD, VND, EUR)
   - status (pending, processing, succeeded, failed, refunded, cancelled)
   - paymentIntentId (Stripe Payment Intent ID)
   - transactionId (External transaction ID)
   - paymentMethod (card, bank_transfer, e-wallet)
   - failureReason (text)
   - metadata (JSON)
   - idempotencyKey (unique)
   - timestamps
   ```

6. **Implement PaymentsService với advanced features:**

   ```typescript
   // Payment Intent creation
   async createPaymentIntent(orderId: string, userId: string) {
     // 1. Get order details
     // 2. Generate idempotency key
     // 3. Create Stripe Payment Intent
     // 4. Save payment record
     // 5. Return client_secret
   }

   // Process successful payment
   async processPayment(paymentIntentId: string) {
     // 1. Verify payment with Stripe
     // 2. Update payment status
     // 3. Update order status
     // 4. Emit payment.succeeded event
     // 5. Send confirmation email
   }

   // Webhook handler
   async handleWebhook(signature: string, payload: Buffer) {
     // 1. VERIFY SIGNATURE (CRITICAL!)
     // 2. Handle event types:
     //    - payment_intent.succeeded
     //    - payment_intent.payment_failed
     //    - charge.refunded
     //    - charge.dispute.created
   }

   // Refund payment
   async refundPayment(paymentId: string, amount?: number) {
     // 1. Validate refund eligibility
     // 2. Create Stripe refund
     // 3. Update payment status
     // 4. Update order status
     // 5. Restore product stock
     // 6. Emit payment.refunded event
   }

   // Retry failed payment
   async retryPayment(paymentId: string) {
     // 1. Check retry limit (max 3 attempts)
     // 2. Create new Payment Intent
     // 3. Update payment record
   }
   ```

7. **Webhook Security (CRITICAL):**

   ```typescript
   @Post('webhook')
   @Header('Content-Type', 'application/json')
   async webhook(@Req() req: RawBodyRequest<Request>) {
     const sig = req.headers['stripe-signature'];
     const rawBody = req.rawBody; // Need raw body for verification

     try {
       // VERIFY SIGNATURE - NEVER skip this!
       const event = this.stripe.webhooks.constructEvent(
         rawBody,
         sig,
         process.env.STRIPE_WEBHOOK_SECRET,
       );

       // Process event
       await this.paymentsService.handleWebhook(event);

       return { received: true };
     } catch (err) {
       // Log security violation
       this.logger.error('Webhook signature verification failed', err);
       throw new BadRequestException('Invalid signature');
     }
   }
   ```

8. **Idempotency Handling:**

   ```typescript
   // Prevent duplicate charges
   const idempotencyKey = `order_${orderId}_${Date.now()}`;

   await stripe.paymentIntents.create(
     {
       amount: amountInCents,
       currency: "usd",
       metadata: { orderId, userId },
     },
     {
       idempotencyKey, // Stripe deduplication
     }
   );
   ```

9. **Endpoints:**

   ```typescript
   POST /payments/create-intent
     - Create payment intent for order
     - Requires: orderId
     - Returns: clientSecret

   POST /payments/confirm/:id
     - Confirm payment (backend confirmation)
     - Admin only or automatic

   POST /payments/webhook
     - Stripe webhook endpoint
     - Public (but verify signature!)
     - Must be raw body (not JSON parsed)

   POST /payments/:id/refund
     - Refund payment
     - Admin only
     - Optional partial refund

   GET /payments/order/:orderId
     - Get payments for order
     - User: own orders, Admin: all orders

   GET /payments/:id
     - Get payment details
   ```

10. **Failed Payment Handling:**

    ```typescript
    async handleFailedPayment(payment: Payment) {
      // 1. Log failure reason
      // 2. Notify user (email)
      // 3. Check if should retry
      // 4. Update order status to 'payment_failed'
      // 5. Optional: restore cart items
    }
    ```

11. **Testing:**

    ```typescript
    // Stripe test cards
    4242 4242 4242 4242 - Succeeds
    4000 0000 0000 0002 - Declined
    4000 0000 0000 9995 - Insufficient funds
    4000 0025 0000 3155 - 3D Secure required

    // Test webhook locally
    stripe listen --forward-to localhost:3000/payments/webhook
    stripe trigger payment_intent.succeeded
    ```

12. **Error Handling:**
    - Network errors: Retry with exponential backoff
    - Card declined: Inform user, suggest retry
    - Insufficient funds: Clear message
    - 3D Secure: Redirect to authentication
13. **Monitoring:**
    - Track payment success rate
    - Monitor failed payment reasons
    - Alert on webhook failures
    - Dashboard with payment metrics
14. **PCI Compliance:**
    - ✅ Never store card numbers
    - ✅ Use Stripe.js for card input (client-side)
    - ✅ Use Payment Intents (not deprecated Charges)
    - ✅ HTTPS only
    - ✅ Secure webhook endpoint

**Kết quả mong đợi:** Production-ready, secure payment system

**💳 Security Checklist:**

- [ ] Webhook signature verification implemented
- [ ] Idempotency keys used
- [ ] No card data stored in database
- [ ] HTTPS enforced
- [ ] Payment amounts verified server-side
- [ ] Refund process tested
- [ ] Failed payment handling implemented
- [ ] Webhook retries configured
- [ ] Payment logs secured
- [ ] PCI compliance reviewed

**⚠️ Critical Notes:**

- Always verify webhook signatures
- Never trust payment amounts from client
- Use idempotency keys for all payment operations
- Test refund flows thoroughly
- Monitor webhook delivery

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
