# Script to create missing optional tasks (66-73)

$tasksDir = "tasks"

# Define optional tasks
$optionalTasks = @(
    @{
        Number = "66"
        Title = "GraphQL API (Alternative to REST)"
        Content = @"
**Mục tiêu:** Flexible data fetching, reduce over-fetching

**Khi nào cần:**
- Mobile apps cần optimize bandwidth
- Frontend cần fetch nhiều resources cùng lúc
- Complex nested data requirements

**Các bước thực hiện:**

1. Install GraphQL: ``npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql``
2. Setup GraphQL module
3. Convert entities to GraphQL types
4. Create resolvers (ProductResolver, OrderResolver, UserResolver)
5. Implement queries and mutations
6. Add subscriptions for real-time
7. DataLoader for N+1 problem
8. GraphQL Playground
9. Coexist with REST API

**Kết quả mong đợi:** Flexible API cho complex clients
"@
    },
    @{
        Number = "67"
        Title = "Microservices Architecture"
        Content = @"
**Mục tiêu:** Scale independently, better fault isolation

**Khi nào cần:**
- Traffic cao (100k+ users)
- Team lớn (10+ developers)
- Need different scaling for different services

**Các bước thực hiện:**

1. Split monolith thành services (User, Product, Order, Payment, Notification)
2. Install microservices package: ``npm install @nestjs/microservices``
3. Choose transport (TCP, Redis, NATS, RabbitMQ, Kafka)
4. Implement message patterns (Request-Response, Event-based)
5. Setup API Gateway
6. Service discovery (Consul, Eureka)
7. Inter-service communication (gRPC, Message queue)
8. Distributed tracing (Jaeger, Zipkin)
9. Optional: Service mesh (Istio, Linkerd)

**Kết quả mong đợi:** Scalable, maintainable microservices
"@
    },
    @{
        Number = "68"
        Title = "Message Queue (RabbitMQ/Kafka)"
        Content = @"
**Mục tiêu:** Asynchronous processing, reliability

**Khi nào cần:**
- Heavy background jobs
- High throughput requirements
- Need retry mechanisms
- Event streaming

**Các bước thực hiện:**

1. Install RabbitMQ: ``npm install @nestjs/microservices amqplib``
2. Or Kafka: ``npm install @nestjs/microservices kafkajs``
3. Setup message broker
4. Create producers (emit events)
5. Create consumers (listen and process)
6. Use cases: Email queue, Image processing, Report generation
7. Dead letter queue for failed messages
8. Monitoring: Queue length, Processing rate

**Kết quả mong đợi:** Reliable async processing
"@
    },
    @{
        Number = "69"
        Title = "Multi-language Support (i18n)"
        Content = @"
**Mục tiêu:** International expansion

**Khi nào cần:**
- Target multiple countries
- Localized content

**Các bước thực hiện:**

1. Install i18n: ``npm install nestjs-i18n``
2. Setup I18nModule
3. Create translation files (en/, vi/, es/)
4. Use in code: ``this.i18n.translate('product.name', { lang: 'vi' })``
5. Detect language (Accept-Language header, user preference, query param)
6. Translate: API responses, Error messages, Email templates
7. Database translations for product names/descriptions

**Kết quả mong đợi:** Multi-language support
"@
    },
    @{
        Number = "70"
        Title = "Multi-currency Support"
        Content = @"
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
"@
    },
    @{
        Number = "71"
        Title = "Social Login (OAuth)"
        Content = @"
**Mục tiêu:** Easy onboarding, reduce friction

**Khi nào cần:**
- Improve conversion rate
- Simplify registration

**Các bước thực hiện:**

1. Install Passport strategies: ``npm install passport-google-oauth20 passport-facebook``
2. Setup OAuth apps (Google Cloud Console, Facebook Developers)
3. Create strategies (GoogleStrategy, FacebookStrategy)
4. Implement auth flow (redirect to provider, handle callback)
5. Create or link user account
6. Issue JWT token
7. Handle edge cases (email exists, merge accounts)
8. Store provider info
9. Optional: GitHub, Twitter/X, Apple Sign In

**Kết quả mong đợi:** Easy social login
"@
    },
    @{
        Number = "72"
        Title = "Product Recommendations (ML)"
        Content = @"
**Mục tiêu:** Increase sales, personalization

**Khi nào cần:**
- Large product catalog (1000+ products)
- Want to increase average order value

**Các bước thực hiện:**

1. Collaborative filtering ("Users who bought X also bought Y")
2. Content-based filtering (similar products by category, attributes)
3. Collect user behavior (views, cart additions, purchases, searches)
4. Recommendation algorithms (similar products, frequently bought together)
5. Implementation options:
   - Simple: SQL queries
   - Medium: Python microservice với scikit-learn
   - Advanced: TensorFlow, PyTorch
   - Cloud: AWS Personalize, Google Recommendations AI
6. Cache recommendations per product
7. Endpoints: GET /products/:id/recommendations
8. A/B testing
9. Track metrics (CTR, conversion rate)

**Kết quả mong đợi:** Smart product recommendations
"@
    },
    @{
        Number = "73"
        Title = "Analytics Dashboard (Google Analytics)"
        Content = @"
**Mục tiêu:** Track user behavior, business metrics

**Khi nào cần:**
- Need detailed insights
- Marketing optimization
- User journey analysis

**Các bước thực hiện:**

1. Create Google Analytics 4 property
2. Frontend tracking (gtag.js, track page views, events)
3. Backend tracking: ``npm install universal-analytics``
4. Custom events (product_viewed, add_to_cart, purchase)
5. E-commerce tracking (transaction ID, revenue, products, tax)
6. User properties (user ID, user type, lifetime value)
7. Conversion funnels (Homepage → Product → Cart → Checkout → Purchase)
8. Integration với admin dashboard (GA Reporting API)
9. Alternative: Mixpanel, Amplitude
10. Privacy compliance (GDPR consent, cookie banner, anonymize IPs)

**Kết quả mong đợi:** Data-driven business decisions
"@
    }
)

# Create each task file
foreach ($task in $optionalTasks) {
    $taskNumber = $task.Number.PadLeft(5, '0')
    $safeTitle = $task.Title `
        -replace '[^\w\s-]', '' `
        -replace '\s+', '-' `
        -replace '-+', '-' `
        -replace '^-+', '' `
        -replace '-+$', ''
    
    $fileName = "TASK-$taskNumber-$safeTitle.md"
    $filePath = Join-Path $tasksDir $fileName
    
    $fileContent = @"
# ### 💡 TASK $($task.Number): $($task.Title)

> **Task Number:** $($task.Number)  
> **Priority:** Optional (Advanced)  
> **Status:** ⬜ Not Started

---

$($task.Content)

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
"@
    
    Set-Content -Path $filePath -Value $fileContent -Encoding UTF8
    Write-Host "✅ Created: $fileName"
}

Write-Host "`n🎉 Done! Created $($optionalTasks.Count) optional task files."
Write-Host "`nOptional tasks (66-73) are now available in 'tasks/' directory."
