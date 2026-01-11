# 📋 TASKS PRIORITY INDEX - E-COMMERCE API

> **Last Updated:** 2026-01-11  
> **Purpose:** Danh sách tasks được sắp xếp lại theo thứ tự ưu tiên thực tế và dependencies  
> **Original Files:** Giữ nguyên trong thư mục `tasks/`

---

## 📊 PROGRESS OVERVIEW

```
✅ Completed:     12/76 tasks (15.8%)
🔴 Critical:       6 tasks (Priority 1 - Tuần này)
🟡 High:          10 tasks (Priority 2 - 2 tuần tới)
🟢 Medium:         5 tasks (Priority 3 - 3-4 tuần)
🔵 Low:           43 tasks (Priority 4 - Sau MVP)
💡 Optional:       8 tasks (Khi cần thiết)
```

---

## ✅ COMPLETED TASKS (01-12)

### Phase 1: Project Setup ✅

- [x] **#01** - Khởi tạo Project NestJS  
      📁 [TASK-00001-Khởi-tạo-Project-NestJS.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00001-Khởi-tạo-Project-NestJS.md)  
      ⏱️ Completed | ✨ Status: Done

- [x] **#02** - Setup Environment & Configuration  
      📁 [002-DONE-Setup-Environment-Configuration.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/002-DONE-Setup-Environment-Configuration.md)  
      ⏱️ Completed | ✨ Status: Done

- [x] **#03** - Setup Database PostgreSQL  
      📁 [003-DONE-Setup-Database-PostgreSQL.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/003-DONE-Setup-Database-PostgreSQL.md)  
      ⏱️ Completed | ✨ Status: Done

- [x] **#04** - Kết nối NestJS với PostgreSQL  
      📁 [TASK-00004-Kết-nối-NestJS-với-PostgreSQL.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00004-Kết-nối-NestJS-với-PostgreSQL.md)  
      ⏱️ Completed | ✨ Status: Done

- [x] **#05** - Setup Global Validation & Error Handling  
      📁 [005-DONE-Setup-Global-Validation-Error-Handling.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/005-DONE-Setup-Global-Validation-Error-Handling.md)  
      ⏱️ Completed | ✨ Status: Done

### Phase 2: Database Design (Partial) ✅

- [x] **#06** - Thiết kế Database Schema  
      📁 [TASK-00005-Thiết-kế-Database-Schema.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00005-Thiết-kế-Database-Schema.md)  
      ⏱️ Completed | ✨ Status: Done

- [x] **#07** - Tạo User Entity  
      📁 [TASK-00006-Tạo-User-Entity.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00006-Tạo-User-Entity.md)  
      ⏱️ Completed | ✨ Status: Done

### Phase 3: Authentication (Partial) ✅

- [x] **#08** - Setup JWT Authentication  
      📁 [008-DONE-Setup-JWT-Authentication.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/008-DONE-Setup-JWT-Authentication.md)  
      ⏱️ Completed | ✨ Status: Done

- [x] **#09** - Tạo Auth DTOs  
      📁 [TASK-00013-Tạo-Auth-DTOs.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00013-Tạo-Auth-DTOs.md)  
      ⏱️ Completed | ✨ Status: Done

- [x] **#10** - Implement Register & Login  
      📁 [010-DONE-Implement-Register-Login.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/010-DONE-Implement-Register-Login.md)  
      ⏱️ Completed | ✨ Status: Done

### Infrastructure (Partial) ✅

- [x] **#11** - Health Check Endpoint (Bonus)  
      ⏱️ Completed | ✨ Status: Done (có sẵn trong codebase)

- [x] **#12** - Basic Error Handling (Bonus)  
      ⏱️ Completed | ✨ Status: Done (có sẵn trong codebase)

---

## 🔴 PRIORITY 1 - CRITICAL (13-18) ⭐ TUẦN NÀY

> **Deadline:** Cuối tuần này  
> **Total Effort:** ~23 giờ (3-4 ngày)  
> **Blocker:** Cần hoàn thành trước khi làm bất kỳ module nào

### Database Entities Completion

- [ ] **#13** - Tạo Category Entity ⭐  
      📁 [TASK-00007-Tạo-Category-Entity.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00007-Tạo-Category-Entity.md)  
      ⏱️ ~3h | 🔗 Dependencies: #06 | 🚦 Blocks: #14

- [ ] **#14** - Tạo Product Entity ⭐  
      📁 [TASK-00008-Tạo-Product-Entity.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00008-Tạo-Product-Entity.md)  
      ⏱️ ~4h | 🔗 Dependencies: #13 | 🚦 Blocks: #15, #16

- [ ] **#15** - Tạo Cart & CartItem Entities ⭐  
      📁 [TASK-00009-Tạo-Cart-CartItem-Entities.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00009-Tạo-Cart-CartItem-Entities.md)  
      ⏱️ ~4h | 🔗 Dependencies: #14 | 🚦 Blocks: #17

- [ ] **#16** - Tạo Order & OrderItem Entities ⭐  
      📁 [TASK-00010-Tạo-Order-OrderItem-Entities.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00010-Tạo-Order-OrderItem-Entities.md)  
      ⏱️ ~5h | 🔗 Dependencies: #14 | 🚦 Blocks: #17

- [ ] **#17** - Generate & Run Migrations ⭐  
      📁 [015-P1-Generate-Run-Migrations.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/015-P1-Generate-Run-Migrations.md)  
      ⏱️ ~3h | 🔗 Dependencies: #13-16 | 🚦 Blocks: All CRUD modules

### Authorization Infrastructure

- [ ] **#18** - Tạo Guards & Decorators ⭐  
      📁 [TASK-00015-Tạo-Guards-Decorators.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/TASK-00015-Tạo-Guards-Decorators.md)  
      ⏱️ ~4h | 🔗 Dependencies: #08, #10 | 🚦 Blocks: All protected endpoints

---

## 🟡 PRIORITY 2 - HIGH (19-28) ⚡ 2 TUẦN TỚI

> **Timeline:** Tuần 2-3  
> **Total Effort:** ~45 giờ (6-7 ngày)  
> **Goal:** Core business modules

### Users Module

- [ ] **#19** - Implement Users CRUD  
      📁 [017-P2-Implement-Users-CRUD.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/017-P2-Implement-Users-CRUD.md)  
      ⏱️ ~5h | 🔗 Dependencies: #18 | 🎯 Priority: High

- [ ] **#20** - Implement User Profile  
      📁 [018-P2-Implement-User-Profile.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/018-P2-Implement-User-Profile.md)  
      ⏱️ ~3h | 🔗 Dependencies: #19 | 🎯 Priority: High

- [ ] **#21** - Implement Change Password  
      📁 [019-P2-Implement-Change-Password.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/019-P2-Implement-Change-Password.md)  
      ⏱️ ~3h | 🔗 Dependencies: #19 | 🎯 Priority: High

### Categories Module

- [ ] **#22** - Implement Categories CRUD  
      📁 [020-P2-Implement-Categories-CRUD.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/020-P2-Implement-Categories-CRUD.md)  
      ⏱️ ~5h | 🔗 Dependencies: #17, #18 | 🎯 Priority: High

- [ ] **#23** - Category Tree & Filtering  
      📁 [021-P2-Category-Tree-Filtering.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/021-P2-Category-Tree-Filtering.md)  
      ⏱️ ~6h | 🔗 Dependencies: #22 | 🎯 Priority: High

### Products Module

- [ ] **#24** - Implement Products CRUD  
      📁 [022-P2-Implement-Products-CRUD.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/022-P2-Implement-Products-CRUD.md)  
      ⏱️ ~6h | 🔗 Dependencies: #17, #22 | 🎯 Priority: High

- [ ] **#25** - Product Filtering & Search  
      📁 [023-P2-Product-Filtering-Search.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/023-P2-Product-Filtering-Search.md)  
      ⏱️ ~5h | 🔗 Dependencies: #24 | 🎯 Priority: High

- [ ] **#26** - Product Stock Management  
      📁 [024-P2-Product-Stock-Management.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/024-P2-Product-Stock-Management.md)  
      ⏱️ ~4h | 🔗 Dependencies: #24 | 🎯 Priority: High

- [ ] **#27** - Product Images & File Upload  
      📁 [025-P2-Product-Images-File-Upload.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/025-P2-Product-Images-File-Upload.md)  
      ⏱️ ~5h | 🔗 Dependencies: #24 | 🎯 Priority: Medium

### Migration Best Practices

- [ ] **#28** - Migration Best Practices & Strategy  
      📁 [026-P2-Migration-Best-Practices-Strategy.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/026-P2-Migration-Best-Practices-Strategy.md)  
      ⏱️ ~3h | 🔗 Dependencies: #17 | 🎯 Priority: Medium

---

## 🟢 PRIORITY 3 - MEDIUM (29-33) 🛒 TUẦN 4

> **Timeline:** Tuần 4  
> **Total Effort:** ~25 giờ (3-4 ngày)  
> **Goal:** Shopping flow implementation

### Shopping Cart

- [ ] **#29** - Implement Shopping Cart  
      📁 [027-P3-Implement-Shopping-Cart.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/027-P3-Implement-Shopping-Cart.md)  
      ⏱️ ~6h | 🔗 Dependencies: #24 | 🎯 Priority: Medium

- [ ] **#30** - Cart Calculations  
      📁 [028-P3-Cart-Calculations.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/028-P3-Cart-Calculations.md)  
      ⏱️ ~4h | 🔗 Dependencies: #29 | 🎯 Priority: Medium

### Orders

- [ ] **#31** - Implement Order Creation  
      📁 [029-P3-Implement-Order-Creation.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/029-P3-Implement-Order-Creation.md)  
      ⏱️ ~8h | 🔗 Dependencies: #30 | 🎯 Priority: Medium | ⚠️ Complex transactions

- [ ] **#32** - Order Management  
      📁 [030-P3-Order-Management.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/030-P3-Order-Management.md)  
      ⏱️ ~6h | 🔗 Dependencies: #31 | 🎯 Priority: Medium

- [ ] **#33** - Order Statistics  
      📁 [031-P3-Order-Statistics.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/031-P3-Order-Statistics.md)  
      ⏱️ ~5h | 🔗 Dependencies: #32 | 🎯 Priority: Low

---

## 🔵 PRIORITY 4 - LOW (34-55) 📚 MVP COMPLETION

> **Timeline:** Tuần 5-6  
> **Goal:** Production-ready infrastructure, testing & documentation

### Infrastructure & Common Features (34-40)

- [ ] **#34** - Global Error Handling  
      📁 [032-P4-Global-Error-Handling.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/032-P4-Global-Error-Handling.md)  
      ⏱️ ~4h | 🎯 Priority: Low

- [ ] **#35** - Request Logging Interceptor  
      📁 [033-P4-Request-Logging-Interceptor.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/033-P4-Request-Logging-Interceptor.md)  
      ⏱️ ~3h | 🎯 Priority: Low

- [ ] **#36** - Response Transform Interceptor  
      📁 [034-P4-Response-Transform-Interceptor.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/034-P4-Response-Transform-Interceptor.md)  
      ⏱️ ~3h | 🎯 Priority: Low

- [ ] **#37** - Complete Swagger Documentation  
      📁 [035-P4-Complete-Swagger-Documentation.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/035-P4-Complete-Swagger-Documentation.md)  
      ⏱️ ~6h | 🔗 Dependencies: All modules | 🎯 Priority: Medium

- [ ] **#38** - Write Unit Tests  
      📁 [036-P4-Write-Unit-Tests.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/036-P4-Write-Unit-Tests.md)  
      ⏱️ ~16h | 🔗 Dependencies: All modules | 🎯 Priority: High

- [ ] **#39** - Write E2E Tests  
      📁 [037-P4-Write-E2E-Tests.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/037-P4-Write-E2E-Tests.md)  
      ⏱️ ~12h | 🔗 Dependencies: All modules | 🎯 Priority: High

- [ ] **#40** - Create README Documentation  
      📁 [038-P4-Create-README-Documentation.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/038-P4-Create-README-Documentation.md)  
      ⏱️ ~4h | 🎯 Priority: Medium

### Advanced Features - Phase 11-13 (41-49)

- [ ] **#41** - Database Optimization  
      📁 [039-P4-Database-Optimization.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/039-P4-Database-Optimization.md)  
      ⏱️ ~5h | 🎯 Priority: Low

- [ ] **#42** - Add Caching (Redis)  
      📁 [040-P4-Add-Caching.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/040-P4-Add-Caching.md)  
      ⏱️ ~6h | 🎯 Priority: Low

- [ ] **#43** - Security Enhancements  
      📁 [041-P4-Security-Enhancements.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/041-P4-Security-Enhancements.md)  
      ⏱️ ~8h | 🎯 Priority: Medium

- [ ] **#44** - Setup CI/CD  
      📁 [042-P4-Setup-CICD.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/042-P4-Setup-CICD.md)  
      ⏱️ ~6h | 🎯 Priority: Low

- [ ] **#45** - Production Deployment  
      📁 [043-P4-Production-Deployment.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/043-P4-Production-Deployment.md)  
      ⏱️ ~8h | 🎯 Priority: Low

- [ ] **#46** - Enforce Clean Architecture Boundaries  
      📁 [044-P4-Enforce-Clean-Architecture-Boundaries.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/044-P4-Enforce-Clean-Architecture-Boundaries.md)  
      ⏱️ ~6h | 🎯 Priority: Low

- [ ] **#47** - Shared Base Classes & Utilities  
      📁 [045-P4-Shared-Base-Classes-Utilities.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/045-P4-Shared-Base-Classes-Utilities.md)  
      ⏱️ ~5h | 🎯 Priority: Low

- [ ] **#48** - Refresh Token & Session Management  
      📁 [046-P4-Refresh-Token-Session-Management.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/046-P4-Refresh-Token-Session-Management.md)  
      ⏱️ ~6h | 🎯 Priority: Medium

- [ ] **#49** - Account Verification & Password Recovery  
      📁 [047-P4-Account-Verification-Password-Recovery.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/047-P4-Account-Verification-Password-Recovery.md)  
      ⏱️ ~8h | 🎯 Priority: Medium

### Advanced E-commerce Features - Phase 14-15 (50-54)

- [ ] **#50** - Product Variants & Attributes  
      📁 [048-P4-Product-Variants-Attributes.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/048-P4-Product-Variants-Attributes.md)  
      ⏱️ ~10h | 🎯 Priority: Low | ⚠️ Complex schema

- [ ] **#51** - Reviews & Ratings  
      📁 [049-P4-Reviews-Ratings.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/049-P4-Reviews-Ratings.md)  
      ⏱️ ~8h | 🎯 Priority: Low

- [ ] **#52** - Wishlist & Favorites  
      📁 [050-P4-Wishlist-Favorites.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/050-P4-Wishlist-Favorites.md)  
      ⏱️ ~6h | 🎯 Priority: Low

- [ ] **#53** - Payment Integration (Advanced)  
      📁 [051-P4-Payment-Integration-Advanced.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/051-P4-Payment-Integration-Advanced.md)  
      ⏱️ ~12h | 🎯 Priority: High | ⚠️ Critical for production

- [ ] **#54** - Order Lifecycle & Event Handling  
      📁 [052-P4-Order-Lifecycle-Event-Handling.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/052-P4-Order-Lifecycle-Event-Handling.md)  
      ⏱️ ~8h | 🎯 Priority: Medium

- [ ] **#55** - Advanced Caching Strategy  
      📁 [053-P4-Advanced-Caching-Strategy.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/053-P4-Advanced-Caching-Strategy.md)  
      ⏱️ ~8h | 🎯 Priority: Low

---

## 🟣 PRIORITY 5 - ENHANCEMENTS (56-73) 🚀 POST-MVP

> **Timeline:** Sau MVP  
> **Goal:** Production enhancements & advanced features

### Performance & Developer Experience (56-62)

- [ ] **#56** - Logging, Monitoring & Tracing  
      📁 [054-P5-Logging-Monitoring-Tracing.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/054-P5-Logging-Monitoring-Tracing.md)

- [ ] **#57** - Rate Limiting & Abuse Protection  
      📁 [055-P5-Rate-Limiting-Abuse-Protection.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/055-P5-Rate-Limiting-Abuse-Protection.md)

- [ ] **#58** - API Versioning  
      📁 [056-P5-API-Versioning.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/056-P5-API-Versioning.md)

- [ ] **#59** - Feature Flags & Config Toggle  
      📁 [057-P5-Feature-Flags-Config-Toggle.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/057-P5-Feature-Flags-Config-Toggle.md)

- [ ] **#60** - Seed Data & Demo Mode  
      📁 [058-P5-Seed-Data-Demo-Mode.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/058-P5-Seed-Data-Demo-Mode.md)

- [ ] **#61** - File Upload Service  
      📁 [059-P5-File-Upload-Service.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/059-P5-File-Upload-Service.md)

- [ ] **#62** - Discount & Coupon System  
      📁 [060-P5-Discount-Coupon-System.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/060-P5-Discount-Coupon-System.md)

### Essential Enhancements (63-73)

- [ ] **#63** - Multiple Shipping Methods  
      📁 [061-P5-Multiple-Shipping-Methods.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/061-P5-Multiple-Shipping-Methods.md)

- [ ] **#64** - Inventory Alerts & Notifications  
      📁 [062-P5-Inventory-Alerts-Notifications.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/062-P5-Inventory-Alerts-Notifications.md)

- [ ] **#65** - Elasticsearch Integration  
      📁 [063-P5-Elasticsearch-Integration.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/063-P5-Elasticsearch-Integration.md)

- [ ] **#66** - Admin Dashboard Statistics  
      📁 [064-P5-Admin-Dashboard-Statistics.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/064-P5-Admin-Dashboard-Statistics.md)

- [ ] **#67** - Real-time Notifications (WebSocket)  
      📁 [065-P5-Real-time-Notifications-WebSocket.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/065-P5-Real-time-Notifications-WebSocket.md)

- [ ] **#68** - Two-Factor Authentication (2FA)  
      📁 [066-P5-Two-Factor-Authentication-2FA.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/066-P5-Two-Factor-Authentication-2FA.md)

- [ ] **#69** - Role-Based Access Control (RBAC)  
      📁 [067-P5-Role-Based-Access-Control-RBAC.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/067-P5-Role-Based-Access-Control-RBAC.md)

- [ ] **#70** - Docker & Kubernetes Configuration  
      📁 [068-P5-Docker-Kubernetes-Configuration.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/068-P5-Docker-Kubernetes-Configuration.md)

- [ ] **#71** - Review & Rating System (Full)  
      📁 [069-P5-Implement-Review-Rating-System.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/069-P5-Implement-Review-Rating-System.md)

- [ ] **#72** - Q&A System  
      📁 [070-P5-Implement-QA-System.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/070-P5-Implement-QA-System.md)

- [ ] **#73** - Loyalty & Membership System  
      📁 [071-P5-Implement-Loyalty-Membership-System.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/071-P5-Implement-Loyalty-Membership-System.md)

---

## 💡 OPTIONAL ADVANCED FEATURES (74-81)

> **Timeline:** Khi cần thiết  
> **Goal:** Enterprise-scale features

- [ ] **#74** - AI Recommendation Engine  
      📁 [072-P5-Implement-AI-Recommendation-Engine.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/072-P5-Implement-AI-Recommendation-Engine.md)

- [ ] **#75** - GraphQL API (Alternative to REST)  
      📁 [073-OPT-GraphQL-API-Alternative-to-REST.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/073-OPT-GraphQL-API-Alternative-to-REST.md)

- [ ] **#76** - Microservices Architecture  
      📁 [074-OPT-Microservices-Architecture.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/074-OPT-Microservices-Architecture.md)

- [ ] **#77** - Message Queue (RabbitMQ/Kafka)  
      📁 [075-OPT-Message-Queue-RabbitMQKafka.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/075-OPT-Message-Queue-RabbitMQKafka.md)

- [ ] **#78** - Multi-language Support (i18n)  
      📁 [076-OPT-Multi-language-Support-i18n.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/076-OPT-Multi-language-Support-i18n.md)

- [ ] **#79** - Multi-currency Support  
      📁 [077-OPT-Multi-currency-Support.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/077-OPT-Multi-currency-Support.md)

- [ ] **#80** - Social Login (OAuth)  
      📁 [078-OPT-Social-Login-OAuth.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/078-OPT-Social-Login-OAuth.md)

- [ ] **#81** - Product Recommendations (ML)  
      📁 [079-OPT-Product-Recommendations-ML.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/079-OPT-Product-Recommendations-ML.md)

- [ ] **#82** - Analytics Dashboard (Google Analytics)  
      📁 [080-OPT-Analytics-Dashboard-Google-Analytics.md](file:///e:/my-pj/nestjs_ex/ecommerce-api-doc/tasks/080-OPT-Analytics-Dashboard-Google-Analytics.md)

---

## 📊 DEPENDENCY GRAPH (Critical Path)

```
Phase 1-2 (Foundation)
├─ #01-#05: Setup ✅
├─ #06: Database Schema ✅
├─ #07: User Entity ✅
├─ #13: Category Entity → #14: Product Entity
├─ #14 → #15: Cart Entities + #16: Order Entities
└─ #17: Migrations (requires #13-16)

Phase 3 (Auth)
├─ #08-#10: Basic Auth ✅
└─ #18: Guards & Decorators (blocks all protected endpoints)

Phase 4-6 (Modules)
├─ #19-#21: Users (requires #18)
├─ #22-#23: Categories (requires #17, #18)
├─ #24-#27: Products (requires #22)
└─ #29-#33: Shopping & Orders (requires #24)

Phase 7-8 (Polish)
├─ #34-#40: Infrastructure & Tests
└─ #41+: Advanced features
```

---

## 🎯 QUICK ACTIONS

### Hôm nay

```bash
# Bắt đầu với task đầu tiên
code tasks/TASK-00007-Tạo-Category-Entity.md
```

### Tuần này

Focus vào **Priority 1** (#13-#18) để unlock các modules tiếp theo

### Tracking Progress

```powershell
# Run script để check progress
.\check-progress.ps1
```

---

## 📝 NOTES

- **Original files:** Giữ nguyên naming convention TASK-XXXXX
- **This index:** Chỉ để tracking và prioritization
- **Status updates:** Cập nhật ở cả 2 nơi (file gốc + index này)
- **Dependencies:** Chỉ mang tính tham khảo, có thể có thay đổi

---

**Last Updated:** 2026-01-11 22:55  
**Next Review:** Cuối tuần (sau khi complete Priority 1)

---

🚀 **Happy coding!**

