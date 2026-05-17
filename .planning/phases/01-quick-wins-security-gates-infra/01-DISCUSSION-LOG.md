# Phase 1: Quick Wins — Security Gates & Infra - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 1 — Quick Wins — Security Gates & Infra
**Areas discussed:** Global rate limit guard, Swagger gating, Cleanup cron job, Type-safe projections

---

## Global Rate Limiting (SEC-03)

### Per-controller guards after APP_GUARD

| Option             | Description                                                                                       | Selected |
| ------------------ | ------------------------------------------------------------------------------------------------- | -------- |
| Xóa per-controller | Dọn sạch redundancy. APP_GUARD đã cover tất cả — giữ lại per-controller guard là duplicate noise. | ✓        |
| Giữ per-controller | Explicit hơn nhưng redundant. Ai đọc code sẽ không biết guard nào đang thực sự enforce.           |          |
| Bạn quyết định     | Claude chọn: xóa per-controller sau khi xác nhận APP_GUARD hoạt động.                             |          |

**User's choice:** Xóa per-controller (Recommended)

---

### Health endpoint throttle

| Option              | Description                                                                                     | Selected |
| ------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| Exclude /health     | Dùng @SkipThrottle() trên HealthController. Render health check tự động không bị 429.           | ✓        |
| Apply throttle luôn | Health check cũng bị limit. Rủi ro thấp nếu Render gọi ít nhưng nếu gọi dày, có thể gây vấn đề. |          |

**User's choice:** Exclude /health (Recommended)

---

### Rate limit config values

| Option                | Description                                                          | Selected |
| --------------------- | -------------------------------------------------------------------- | -------- |
| Giữ nguyên (10/60s)   | Strict nhưng acceptable cho portfolio. Đã có sẵn trong AppModule.    |          |
| Tăng lên 100/60s      | Realistic hơn cho dev/testing.                                       |          |
| Configure qua env var | THROTTLE_LIMIT + THROTTLE_TTL — linh hoạt hơn nhưng thêm complexity. | ✓        |

**User's choice:** Configure qua env var

---

## Swagger Gating (SEC-01)

### Gate mechanism

| Option                 | Description                                                                               | Selected |
| ---------------------- | ----------------------------------------------------------------------------------------- | -------- |
| NODE_ENV check         | `if (configService.get('NODE_ENV') !== 'production')` — đơn giản, match success criteria. |          |
| ENABLE_SWAGGER env var | Linh hoạt hơn (có thể bật staging), nhưng thêm env var mới.                               | ✓        |

**User's choice:** ENABLE_SWAGGER env var

---

### Joi validation + default

| Option                      | Description                                                                                  | Selected |
| --------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Joi optional, default false | ENABLE_SWAGGER optional trong Joi, mặc định false — an toàn, không set = không thấy Swagger. | ✓        |
| Joi optional, default true  | Không set = vẫn thấy Swagger. Rủi ro quên set production.                                    |          |
| Không cần Joi validate      | Chỉ dùng configService.get() với falsy check.                                                |          |

**User's choice:** Joi optional, default false (Recommended)

---

### Gate /api-json

| Option            | Description                                                          | Selected |
| ----------------- | -------------------------------------------------------------------- | -------- |
| Gate cả /api-json | Khi skip SwaggerModule.setup(), cả UI lẫn JSON spec đều không mount. | ✓        |
| Chỉ gate UI       | /api-json vẫn accessible — hữu dụng cho external tooling.            |          |

**User's choice:** Gate cả /api-json (Recommended)

---

## Cleanup Cron Job (INFRA-01)

### TasksModule placement

| Option                  | Description                                                      | Selected |
| ----------------------- | ---------------------------------------------------------------- | -------- |
| src/tasks/ module riêng | Clean separation, easy to find, follow NestJS module convention. | ✓        |
| Inline vào AppModule    | Ít file hơn nhưng AppModule đã đủ lớn, khó maintain hơn.         |          |

**User's choice:** src/tasks/ module riêng (Recommended)

---

### Cron schedule

| Option                   | Description                                                                      | Selected |
| ------------------------ | -------------------------------------------------------------------------------- | -------- |
| Midnight daily cron      | @Cron('0 0 \* \* \*') — chạy lúc 0h mỗi ngày, observable qua logs.               | ✓        |
| Configurable qua env var | CLEANUP_CRON_SCHEDULE env var — linh hoạt nhưng thêm complexity không cần thiết. |          |

**User's choice:** Midnight daily cron (Recommended)

---

### Error handling

| Option                 | Description                                                               | Selected |
| ---------------------- | ------------------------------------------------------------------------- | -------- |
| Log error, không throw | try/catch, logger.error(...) — job fail không ảnh hưởng app.              | ✓        |
| Log + re-throw         | NestJS sẽ catch unhandled exception — có thể crash scheduled job context. |          |

**User's choice:** Log error, không throw (Recommended)

---

## Type-safe Projections (INFRA-02 + INFRA-03)

### userSelect const placement

| Option                                     | Description                                                                              | Selected |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | -------- |
| Local const trong service file             | Giữ gần nơi dùng, consistent với `getProductSelect()` pattern trong ProductsService.     | ✓        |
| File riêng src/modules/users/user.types.ts | Shared tường minh hơn nếu nhiều service dùng cùng type. Nhưng hiện tại over-engineering. |          |

**User's choice:** Trong file service, local const (Recommended)

---

### INFRA-02 scope

| Option                | Description                                           | Selected |
| --------------------- | ----------------------------------------------------- | -------- |
| Chỉ 3 modules         | Match đúng success criteria: users, auth, categories. | ✓        |
| Scan toàn bộ codebase | Thorough hơn nhưng ngoài success criteria.            |          |

**User's choice:** Chỉ 3 modules (Recommended)

---

## Claude's Discretion

- Log số rows deleted cho mỗi table sau mỗi cleanup run (INFRA-01) — không được hỏi rõ nhưng hợp lý.
- ThrottlerModule config defaults khi THROTTLE_TTL/THROTTLE_LIMIT không set — Claude quyết định giá trị defaults hợp lý.

## Deferred Ideas

None — discussion stayed within phase scope.
