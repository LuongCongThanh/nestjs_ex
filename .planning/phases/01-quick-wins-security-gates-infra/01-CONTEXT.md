# Phase 1: Quick Wins — Security Gates & Infra - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure config/refactor phase — tighten security và code quality của surface hiện có mà không đụng schema hay business logic.

Deliverables:

1. Swagger UI gated bằng `ENABLE_SWAGGER` env var (default false, Joi optional)
2. `ThrottlerGuard` apply globally qua `APP_GUARD`, health endpoint exclude via `@SkipThrottle()`
3. Daily cron cleanup expired rows từ `TokenBlacklist`, `RefreshToken`, `EmailVerification`
4. `as any` / `as unknown as User` casts được thay bằng type-safe Prisma projections trong 3 modules
5. `FindProductsQueryDto` và `FindUsersQueryDto` extend `PaginationDto`

</domain>

<decisions>
## Implementation Decisions

### SEC-01: Swagger Gating

- **D-01:** Sử dụng `ENABLE_SWAGGER` env var (không dùng `NODE_ENV` check trực tiếp) — cho phép linh hoạt bật ở staging nếu cần.
- **D-02:** Joi schema: `ENABLE_SWAGGER` là optional, default `false`. Khi không set = không thấy Swagger.
- **D-03:** Gate cả UI (`/api`) lẫn JSON spec (`/api-json`) — khi `ENABLE_SWAGGER` là false, `SwaggerModule.setup()` không được gọi, cả hai route đều không mount.

### SEC-03: Global Rate Limiting

- **D-04:** Đăng ký `ThrottlerGuard` là `APP_GUARD` trong `AppModule.providers` — áp dụng cho tất cả endpoints.
- **D-05:** Xóa tất cả `@UseGuards(ThrottlerGuard)` per-controller sau khi `APP_GUARD` hoạt động — dọn dẹp redundancy.
- **D-06:** `HealthController` được annotate `@SkipThrottle()` — Render.com health check không bị 429.
- **D-07:** Throttle config (ttl, limit) đọc từ env vars `THROTTLE_TTL` và `THROTTLE_LIMIT` — linh hoạt cho dev/test. Joi validate optional với defaults hợp lý.

### INFRA-01: Cleanup Cron Job

- **D-08:** Tạo `src/tasks/tasks.module.ts` + `tasks.service.ts` — module riêng, không inline vào AppModule.
- **D-09:** Schedule: `@Cron('0 0 * * *')` — midnight daily, observable qua logs. Cứng, không configurable qua env.
- **D-10:** Error strategy: `try/catch` + `logger.error(...)`. Job fail không throw, không ảnh hưởng app. Expired rows được cleanup lần sau.
- **D-11:** Log kết quả: log số rows deleted cho mỗi table sau mỗi cleanup run.

### INFRA-02: Type-safe Prisma Projections

- **D-12:** `userSelect` const định nghĩa local trong service file (không tạo shared types file) — consistent với pattern `getProductSelect()` private method trong `ProductsService`.
- **D-13:** Scope chỉ 3 modules theo success criteria: `users`, `auth`, `categories`. Không scan toàn bộ codebase.
- **D-14:** Return type dùng `Prisma.UserGetPayload<{ select: typeof userSelect }>` pattern.

### INFRA-03: PaginationDto Extension

- **D-15:** `FindProductsQueryDto` và `FindUsersQueryDto` extend `PaginationDto` bằng cách xóa duplicate fields. Không thay đổi behavior, chỉ DRY.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context

- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Requirements SEC-01, SEC-03, INFRA-01, INFRA-02, INFRA-03 với acceptance criteria chi tiết

### Roadmap

- `.planning/ROADMAP.md` — Phase 1 success criteria (4 criteria cụ thể, phải đáp ứng đúng)

### Codebase Maps

- `.planning/codebase/ARCHITECTURE.md` — AppModule wiring, ThrottlerModule config, data flow
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, ESLint rules, module design conventions

### Key Source Files

- `src/main.ts` — Swagger setup hiện tại (lines 51-58, không có guard)
- `src/app.module.ts` — ThrottlerModule config hiện tại (10 req/60s, chưa có APP_GUARD)
- `src/config/env.validation.ts` — Joi schema để thêm ENABLE_SWAGGER, THROTTLE_TTL, THROTTLE_LIMIT

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `ThrottlerModule` đã configured trong `app.module.ts:24-29` với `{ ttl: 60000, limit: 10 }` — chỉ cần thêm `APP_GUARD` provider và đổi sang env-based config.
- `PrismaService` inject sẵn trong tất cả services — TasksService có thể inject trực tiếp để delete expired rows.
- `@nestjs/schedule` chưa installed — cần thêm dependency.

### Established Patterns

- Module structure: `src/{name}/{name}.module.ts` + `{name}.service.ts` — TasksModule theo đúng pattern này.
- Cron error handling: Logger pattern `private readonly logger = new Logger(ClassName.name)` dùng nhất quán trong project.
- Env validation: Joi schema trong `src/config/env.validation.ts` — thêm vars mới vào đây.
- `ProductsService` có `getProductSelect()` private method làm tiền lệ cho local select const pattern.

### Integration Points

- `AppModule` cần import `ScheduleModule.forRoot()` và `TasksModule`.
- `AppModule.providers` cần thêm `{ provide: APP_GUARD, useClass: ThrottlerGuard }`.
- `HealthController` cần `@SkipThrottle()` decorator từ `@nestjs/throttler`.
- Env validation schema cần 3 vars mới: `ENABLE_SWAGGER`, `THROTTLE_TTL`, `THROTTLE_LIMIT`.

</code_context>

<specifics>
## Specific Ideas

- Rate limit config qua env var (`THROTTLE_TTL`, `THROTTLE_LIMIT`) để dễ test local mà không cần rebuild.
- ENABLE_SWAGGER default false = production-safe out of the box — không cần action thêm khi deploy.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 1 — Quick Wins — Security Gates & Infra_
_Context gathered: 2026-05-16_
