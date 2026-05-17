# Phase 2: Order, Cart & Address — Research

**Researched:** 2026-05-17
**Domain:** NestJS module architecture, Prisma transactions, nanoid, HTTP response interceptor patterns
**Confidence:** HIGH (all key claims verified against codebase or npm registry)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Modify `TransformResponseInterceptor` to skip wrapping when `statusCode === 204`. Add early return: `if (statusCode === 204) return of(undefined)` before the `map` pipe.
- **D-02:** Fix applies globally — covers `DELETE /cart/items/:id`, `DELETE /cart`, and the new `PATCH /cart/items/:id` (qty=0) case.
- **D-03:** Create standalone `AddressModule` at `src/modules/addresses/`. `AddressController` uses `@Controller('users/me/addresses')`. Module imports `PrismaModule`, registered in `AppModule.imports[]`.
- **D-04:** `AddressController` uses `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` at class level — all address routes are private.
- **D-05:** Install `nanoid@3` (CommonJS-compatible). Import as `import { nanoid } from 'nanoid'`.
- **D-06:** `orderNumber` format: `` `ORD-${Date.now()}-${nanoid(6)}` `` — replaces existing `` `ORD-${Date.now()}` `` at `order.service.ts:30`.
- **D-07:** Use Prisma ORM approach inside `prisma.$transaction(async (tx) => { ... })` — call `tx.product.findMany({ where: { id: { in: productIds } } })` then check stock. Throw `BadRequestException` before creating order rows if any item fails. No `SELECT FOR UPDATE`.
- **D-08:** Use atomic Prisma decrement: `tx.product.update({ where: { id }, data: { stock: { decrement: quantity } } })`. Run in `Promise.all()`. Do NOT calculate `newStock` in JS.

### Claude's Discretion

None recorded.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                     | Research Support                                                                                                       |
| ------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ORD-01  | Order creation trừ stock trong cùng Prisma transaction, fail nếu stock không đủ | Prisma `$transaction` pattern confirmed in `order.service.ts:29`; atomic `{ decrement: N }` operator verified          |
| ORD-02  | Order number không bị collision — dùng `ORD-{Date.now()}-{nanoid(6)}`           | nanoid@3.3.12 (CommonJS) verified on npm; `package.json` has no `"type"` field (CommonJS default)                      |
| ORD-03  | `GET /orders` trả về pagination `{ data, page, limit, total }`                  | `PaginationDto` with `skip`/`take` getters verified; `UsersService.findAll` pattern confirmed as reference             |
| CART-01 | `PATCH /cart/items/:id` với `quantity: 0` → 204 No Content                      | Bug location confirmed: `cart.service.ts:47-50` returns `null`; interceptor bypass logic identified                    |
| ADDR-01 | User CRUD địa chỉ qua `/users/me/addresses`                                     | `Address` model verified in `prisma/schema.prisma:104-122`; no `AddressModule` exists yet                              |
| ADDR-02 | Đánh dấu default address — atomic unset previous default                        | `isDefault` field confirmed in schema; Prisma `$transaction` pattern for atomic toggle identified                      |
| ADDR-03 | Order creation chấp nhận `addressId`, snapshot 8 fields vào Order               | All 8 fields (`fullName`, `phone`, `address`, `ward`, `district`, `city`, `country`, `postalCode`) confirmed in schema |

</phase_requirements>

---

## Summary

Phase 2 là một brownfield hardening phase với 4 luồng công việc độc lập song song: (1) tạo mới `AddressModule` hoàn chỉnh, (2) fix 4 bug đã biết trong `OrderService`, (3) fix bug 204 trong `CartService`/interceptor, và (4) cài đặt `nanoid`.

Codebase đã có nền tảng tốt: `Address` model với đủ 8 fields tồn tại trong schema Prisma, `PaginationDto` với `skip`/`take` getters đã sẵn sàng tái dùng, pattern module (`CartModule`, `OrderModule`) rõ ràng và nhất quán. Không có schema migration nào cần thiết — tất cả thay đổi là code-only.

Điểm quan trọng nhất cần lưu ý khi planning: `PaginationDto` có `get skip()` và `get take()` dưới dạng getter (không phải plain field) — planner cần dùng `query.skip` / `query.take` thay vì `(query.page - 1) * query.limit`. Ngoài ra, SPEC yêu cầu response `{ data, page, limit, total }` nhưng `PaginationDto` đã có `createPaginatedResult()` trả về `{ data, meta: { page, limit, total, totalPages, ... } }` — planner cần quyết định dùng format nào (khuyến nghị: dùng flat `{ data, page, limit, total }` theo SPEC, không dùng nested `meta`).

**Primary recommendation:** Thực hiện 4 luồng công việc theo thứ tự: (1) cài nanoid, (2) fix interceptor 204, (3) fix OrderService, (4) tạo AddressModule — mỗi luồng có thể commit độc lập.

---

## Architectural Responsibility Map

| Capability                      | Primary Tier  | Secondary Tier | Rationale                                                    |
| ------------------------------- | ------------- | -------------- | ------------------------------------------------------------ |
| Address CRUD                    | API / Backend | Database       | Business logic + auth scoping nằm ở service layer            |
| Default address toggle (atomic) | API / Backend | Database       | Prisma `$transaction` đảm bảo atomicity ở DB level           |
| Stock decrement on order        | API / Backend | Database       | Transaction logic trong `OrderService`, Prisma thực thi ở DB |
| Order number generation         | API / Backend | —              | `nanoid` chạy in-process tại service layer                   |
| addressId ownership validation  | API / Backend | —              | Service so sánh `address.userId === requestingUserId`        |
| Address snapshot                | API / Backend | Database       | Service lấy Address record từ DB, ghi JSON vào Order         |
| Paginated order listing         | API / Backend | Database       | `findMany + count` với `skip/take` trong service layer       |
| 204 interceptor bypass          | API / Backend | —              | Global interceptor ở NestJS middleware layer                 |

---

## Standard Stack

### Core (đã có trong project)

| Library             | Version hiện tại | Purpose                                       | Ghi chú                  |
| ------------------- | ---------------- | --------------------------------------------- | ------------------------ |
| `@nestjs/common`    | ^11.0.15         | Module, Controller, Service, Guards           | [VERIFIED: package.json] |
| `@prisma/client`    | ^6.19.2          | ORM, transaction, type-safe queries           | [VERIFIED: package.json] |
| `class-validator`   | ^0.14.4          | DTO validation (`@IsUUID`, `@IsOptional`)     | [VERIFIED: package.json] |
| `class-transformer` | ^0.5.1           | `@Type()` cho PaginationDto                   | [VERIFIED: package.json] |
| `@nestjs/swagger`   | ^11.2.6          | `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation` | [VERIFIED: package.json] |

### Thư viện cần cài mới

| Library  | Version  | Purpose                      | Ghi chú                                                                   |
| -------- | -------- | ---------------------------- | ------------------------------------------------------------------------- |
| `nanoid` | `3.3.12` | Collision-safe random suffix | [VERIFIED: npm registry] — latest stable v3; author: `ai` (Andrey Sitnik) |

**Installation:**

```bash
npm install nanoid@3
```

Lý do dùng v3 thay v4+: project không có `"type": "module"` trong `package.json` → CommonJS default. nanoid v4+ là pure ESM và sẽ gây `ERR_REQUIRE_ESM`. [VERIFIED: package.json — `"type"` field absent]

---

## Package Legitimacy Audit

> slopcheck không cài được trong môi trường này — thực hiện manual verification.

| Package | Registry | Age    | Downloads      | Source Repo          | slopcheck      | Disposition |
| ------- | -------- | ------ | -------------- | -------------------- | -------------- | ----------- |
| nanoid  | npm      | ~8 yrs | >200M/wk (est) | github.com/ai/nanoid | Manual OK [OK] | Approved    |

**Verification manual cho nanoid:**

- `npm view nanoid@3.3.12` → author: `ai <andrey@sitnik.es>`, repository: `git+https://github.com/ai/nanoid.git` [VERIFIED: npm registry]
- Không có `scripts.postinstall` [VERIFIED: npm view]
- Đây là package cực kỳ phổ biến và được biết đến rộng rãi (Andrey Sitnik, tác giả PostCSS)

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
HTTP Request
     |
     v
[JwtAuthGuard] --> extract userId from JWT
     |
     v
[AddressController]         [CartController]            [OrderController]
POST /users/me/addresses     PATCH /cart/items/:id       POST /orders
GET  /users/me/addresses     (qty=0 → 204)               GET  /orders?page=&limit=
PATCH /users/me/addresses/:id
DELETE /users/me/addresses/:id (block if isDefault)
     |                            |                            |
     v                            v                            v
[AddressService]           [CartService]               [OrderService]
 - CRUD scoped to userId    - updateItemQuantity        - createOrder (tx)
 - isDefault toggle (tx)    - returns void if qty=0     - findAll (paginated)
 - 400 on delete default
     |                            |                            |
     v                            v                            v
[PrismaService] ──────────── [prisma.$transaction] ──────────────────>
     |                                                         |
     v                                                         v
[addresses table]          [cart_items table]         [orders table]
                                                       [order_items table]
                                                       [products table] (stock decrement)

     |__ All success responses pass through __>
                                               [TransformResponseInterceptor]
                                                  if statusCode === 204 → of(undefined)
                                                  else → wrap { statusCode, success, message, data }
```

### Recommended Project Structure (new files)

```
src/modules/addresses/
├── addresses.module.ts          # imports PrismaModule, export AddressService
├── addresses.controller.ts      # @Controller('users/me/addresses'), class-level JWT guard
├── addresses.service.ts         # CRUD + isDefault toggle + delete protection
└── dto/
    ├── create-address.dto.ts    # fullName, phone, address, ward?, district?, city, country, postalCode?, isDefault?
    └── update-address.dto.ts    # PartialType(CreateAddressDto) or separate fields
```

### Pattern 1: AddressModule — Mirror CartModule Structure

**What:** Standalone module với PrismaModule import, đăng ký trong AppModule.
**When to use:** Tất cả feature module trong project này.

```typescript
// addresses.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AddressController } from './addresses.controller';
import { AddressService } from './addresses.service';

@Module({
  imports: [PrismaModule],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
```

```typescript
// addresses.controller.ts — class-level guards (mirror CartController)
// Source: src/modules/cart/cart.controller.ts [VERIFIED: codebase]
@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/addresses')
export class AddressController { ... }
```

### Pattern 2: Prisma Atomic Default Toggle

**What:** Unset tất cả địa chỉ cũ và set địa chỉ mới làm default trong một transaction.
**When to use:** `PATCH /users/me/addresses/:id` với `{ isDefault: true }`.

```typescript
// Source: Prisma $transaction pattern confirmed in order.service.ts:29 [VERIFIED: codebase]
async setDefault(userId: string, addressId: string) {
  return this.prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    return tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  });
}
```

### Pattern 3: Stock Check + Atomic Decrement (D-07, D-08)

**What:** Fetch stock, validate, decrement trong cùng transaction.
**When to use:** `createOrder`.

```typescript
// Source: Decision D-07, D-08 từ CONTEXT.md; Prisma docs [VERIFIED: decisions]
const order = await this.prisma.$transaction(async (tx) => {
  // 1. Fetch current stock cho tất cả products
  const productIds = cart.items.map((i) => i.productId);
  const products = await tx.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 2. Stock check — throw TRƯỚC khi tạo bất kỳ row nào
  for (const item of cart.items) {
    const product = productMap.get(item.productId)!;
    if (product.stock < item.quantity) {
      throw new BadRequestException(
        `Insufficient stock for: ${product.name} (requested ${item.quantity}, available ${product.stock})`
      );
    }
  }

  // 3. Tạo order
  const created = await tx.order.create({ ... });

  // 4. Atomic decrement song song
  await Promise.all(
    cart.items.map((item) =>
      tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    )
  );

  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  return created;
});
```

### Pattern 4: TransformResponseInterceptor 204 Bypass (D-01)

**What:** Early return `of(undefined)` khi statusCode là 204, trước khi gọi `map()`.
**When to use:** Fix `transform-response.interceptor.ts`.

```typescript
// Source: src/common/interceptors/transform-response.interceptor.ts [VERIFIED: codebase]
// Thêm TRƯỚC `return next.handle().pipe(map(...))` block hiện tại

return next.handle().pipe(
  map((data: unknown) => {
    const statusCode = response.statusCode;

    // [NEW] 204 bypass — return empty observable, do NOT wrap
    if (statusCode === 204) {
      return undefined as unknown as Response<T>;
    }

    // ... existing logic ...
  }),
);
```

**Lưu ý kỹ thuật:** `of(undefined)` không hoạt động trong `map()` pipe — thay vào đó return `undefined` từ trong `map` callback. NestJS sẽ không ghi body khi status là 204. Nếu muốn dùng `of(undefined)` cần dùng `switchMap`:

```typescript
// Alternative pattern — dùng switchMap thay map
return next.handle().pipe(
  switchMap((data: unknown) => {
    const statusCode = response.statusCode;
    if (statusCode === 204) return of(undefined);
    // ... wrap data ...
    return of({ statusCode, success: true, message, data });
  }),
);
```

### Pattern 5: Paginated findAll cho OrderService

**What:** Dùng `PaginationDto` + `Promise.all([findMany, count])` pattern.
**When to use:** `GET /orders`.

```typescript
// Source: UsersService.findAll pattern [VERIFIED: codebase]
async findAll(userId: string, role: UserRole, query: PaginationDto) {
  const where = role === UserRole.user ? { userId } : {};
  const [data, total] = await Promise.all([
    this.prisma.order.findMany({
      where,
      skip: query.skip,   // getter từ PaginationDto
      take: query.take,   // getter từ PaginationDto
      include: { orderItems: { include: { product: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.order.count({ where }),
  ]);

  return {
    data,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    total,
  };
}
```

**Lưu ý:** SPEC yêu cầu flat response `{ data, page, limit, total }` — KHÔNG dùng `createPaginatedResult()` (trả về nested `{ data, meta: { ... } }`) vì sẽ khác format.

### Pattern 6: nanoid Import (D-05, D-06)

```typescript
// Source: nanoid v3 CommonJS docs [VERIFIED: npm registry]
import { nanoid } from 'nanoid';

const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;
```

### Anti-Patterns to Avoid

- **Tính newStock trong JS rồi set tuyệt đối:** `data: { stock: currentStock - qty }` → race condition nếu có concurrent requests. Dùng `{ stock: { decrement: qty } }` thay thế.
- **Dùng `nanoid@4+` trong CommonJS project:** Gây `ERR_REQUIRE_ESM`. Project này không có `"type": "module"` → dùng `nanoid@3`.
- **Dùng `createPaginatedResult()`** cho `GET /orders`: Trả về nested `meta` object, không khớp SPEC yêu cầu flat `{ data, page, limit, total }`.
- **Duplicate fields thay vì dùng `PaginationDto.skip`/`.take` getter:** Tự tính `(page-1)*limit` thay vì dùng getter đã có.
- **Tạo mới DTO cho GET /orders query params:** CONTEXT.md khóa rõ phải dùng `PaginationDto` đã có.
- **Xóa default address mà không check:** Phải check `address.isDefault === true` và throw `400` trước khi delete.
- **Snapshot từ request body:** `shippingAddressSnapshot` PHẢI lấy từ DB record, không phải từ user-supplied data.

---

## Don't Hand-Roll

| Problem                          | Don't Build              | Use Instead                               | Why                                                         |
| -------------------------------- | ------------------------ | ----------------------------------------- | ----------------------------------------------------------- |
| Unique suffix cho order number   | Custom UUID/random logic | `nanoid(6)` từ `nanoid@3`                 | Cryptographically secure, URL-safe, well-tested             |
| Atomic multi-row update          | Sequential updates       | `prisma.$transaction()` với `updateMany`  | Tránh race condition, DB-level atomicity                    |
| Stock decrement                  | `stock = current - qty`  | `{ stock: { decrement: qty } }` Prisma op | Atomic DB operation, không bị race condition                |
| Pagination skip/take calculation | `(page-1)*limit`         | `PaginationDto.skip` và `.take` getters   | Đã có sẵn, validated, DRY                                   |
| JWT user extraction              | Manual header parsing    | `@GetUser()` decorator                    | Đã có sẵn tại `src/common/decorators/get-user.decorator.ts` |
| UUID param validation            | Manual regex check       | `ParseUUIDPipe` (NestJS built-in)         | Đã dùng trong `UsersController`                             |

---

## Common Pitfalls

### Pitfall 1: nanoid v4 ERR_REQUIRE_ESM

**What goes wrong:** `import { nanoid } from 'nanoid'` với v4+ → `Error [ERR_REQUIRE_ESM]: require() of ES Module`
**Why it happens:** nanoid v4+ drop CommonJS support, chỉ export ESM. NestJS compile với CommonJS theo default.
**How to avoid:** Cài `npm install nanoid@3` — v3.3.12 là latest trong dải v3, hỗ trợ CJS.
**Warning signs:** Build lỗi hoặc runtime crash ngay khi import.

### Pitfall 2: 204 Response vẫn bị wrap bởi Interceptor

**What goes wrong:** `PATCH /cart/items/:id` với qty=0 trả về `{ statusCode: 204, success: true, message: "..." }` thay vì empty body.
**Why it happens:** Interceptor hiện tại (line 44-54) check `data === null` và vẫn return JSON object.
**How to avoid:** Thêm check `if (statusCode === 204) return undefined` TRONG `map()` callback, trước tất cả logic khác. Confirm rằng `@HttpCode(HttpStatus.NO_CONTENT)` được thêm vào `updateItem` handler trong CartController.
**Warning signs:** Postman thấy response body có JSON thay vì empty 204.

### Pitfall 3: PaginationDto getter không hoạt động sau deserialization

**What goes wrong:** `query.skip` trả về `NaN` hoặc `undefined`.
**Why it happens:** Nếu `PaginationDto` được instantiated thủ công (không qua NestJS pipe), `@Type(() => Number)` không chạy → `page` là string.
**How to avoid:** Dùng `@Query() query: PaginationDto` trong controller — NestJS sẽ tự dùng `ValidationPipe` + `class-transformer`. Không instantiate thủ công.
**Warning signs:** `GET /orders?page=2&limit=10` trả về tất cả records thay vì 10 items.

### Pitfall 4: Race condition khi check stock trước transaction

**What goes wrong:** Stock check nằm NGOÀI transaction → hai requests đồng thời đều pass check, cả hai đều decrement.
**Why it happens:** Check stock ở service level trước khi gọi `$transaction`.
**How to avoid:** Stock check phải nằm BÊN TRONG `prisma.$transaction(async (tx) => { ... })` — dùng `tx.product.findMany` không phải `this.prisma.product.findMany`.
**Warning signs:** Stock có thể về âm.

### Pitfall 5: addressId ownership check thiếu

**What goes wrong:** User A có thể dùng address của User B để tạo order.
**Why it happens:** Chỉ check address tồn tại (`findUnique`) mà không check `address.userId === requestingUserId`.
**How to avoid:** Sau `findUnique`, check `if (address.userId !== userId) throw new ForbiddenException()`.
**Warning signs:** 403 không được trả về khi test với addressId của user khác.

### Pitfall 6: Snapshot từ DTO thay vì DB record

**What goes wrong:** `shippingAddressSnapshot = dto.shippingAddress` (freeform user input).
**Why it happens:** Nhầm lẫn giữa input DTO và DB lookup.
**How to avoid:** Sau khi resolve address từ DB, map 8 fields tường minh: `{ fullName: address.fullName, phone: address.phone, ... }`. Không spread toàn bộ address object (sẽ include `id`, `userId`, `createdAt`).
**Warning signs:** Snapshot chứa fields như `id`, `userId` không mong muốn.

---

## Code Examples

### Create Address DTO pattern

```typescript
// Source: class-validator patterns from existing DTOs [VERIFIED: codebase]
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: '123 Nguyen Hue' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'Ben Nghe' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: 'District 1' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Vietnam' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: '700000' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
```

### CreateOrderDto sau khi migrate (ORD-03, ADDR-03)

```typescript
// Replaces: src/modules/order/dto/create-order.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'UUID of the shipping address', example: 'uuid-here' })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({ example: 'Please leave at the door' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
```

### Address snapshot construction (ADDR-03, REQ-8)

```typescript
// Lấy address từ DB rồi map tường minh — không spread toàn bộ object
const address = await tx.address.findUnique({ where: { id: dto.addressId } });
if (!address) throw new NotFoundException('Address not found');
if (address.userId !== userId) throw new ForbiddenException('Address does not belong to you');

const snapshot: Prisma.JsonObject = {
  fullName: address.fullName,
  phone: address.phone,
  address: address.address,
  ward: address.ward ?? null,
  district: address.district ?? null,
  city: address.city,
  country: address.country,
  postalCode: address.postalCode ?? null,
};
```

---

## Verified Facts from Codebase

### `Address` Model Schema (VERIFIED)

```
[VERIFIED: prisma/schema.prisma:104-122]
model Address {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @db.Uuid
  fullName   String           ← field 1
  phone      String           ← field 2
  address    String           ← field 3
  ward       String?          ← field 4 (optional)
  district   String?          ← field 5 (optional)
  city       String           ← field 6
  country    String           ← field 7
  postalCode String?          ← field 8 (optional)
  isDefault  Boolean  @default(false)
  ...
}
```

Tất cả 8 fields tồn tại. `ward`, `district`, `postalCode` là optional (`String?`).

### `PaginationDto` Structure (VERIFIED)

```
[VERIFIED: src/common/dto/pagination.dto.ts]
- page?: number = 1    (min: 1, @IsInt, @Type Number)
- limit?: number = 10  (min: 1, max: 100, @IsInt, @Type Number)
- get skip(): number   (computed: (page-1)*limit)
- get take(): number   (computed: limit)
- createPaginatedResult<T>() helper → { data, meta: { page, limit, total, totalPages, hasNextPage, hasPreviousPage } }
```

**Critical:** SPEC yêu cầu flat `{ data, page, limit, total }` — KHÔNG dùng `createPaginatedResult()`.

### `order.service.ts` Bug Locations (VERIFIED)

```
[VERIFIED: src/modules/order/order.service.ts]
- Line 30: orderNumber = `ORD-${Date.now()}` → cần thêm -${nanoid(6)}
- Line 29-54: $transaction không có product.update → stock không bị trừ
- Line 38: shippingAddressSnapshot: dto.shippingAddress → cần addressId lookup
- Line 59-65: findAll returns raw array → cần pagination
```

### `cart.service.ts` Bug Location (VERIFIED)

```
[VERIFIED: src/modules/cart/cart.service.ts:47-50]
if (dto.quantity === 0) {
  await this.prisma.cartItem.delete({ where: { id: item.id } });
  return null;  ← BUG: controller nhận null, trả 200+null
}
```

CartController `updateItem` handler (line 42-45) không có `@HttpCode(HttpStatus.NO_CONTENT)` — cần thêm cả decorator lẫn fix service return void.

### `TransformResponseInterceptor` Insert Point (VERIFIED)

```
[VERIFIED: src/common/interceptors/transform-response.interceptor.ts:43-54]
return next.handle().pipe(
  map((data: unknown) => {
    const statusCode = response.statusCode;
    // ← INSERT 204 check HERE, trước mọi logic khác
    if (statusCode === 204) return undefined as unknown as Response<T>;
    ...
  })
);
```

### `AppModule.imports[]` Thứ tự hiện tại (VERIFIED)

```
[VERIFIED: src/app.module.ts:19-39]
PrismaModule, HealthModule, AuthModule, UsersModule, CategoriesModule,
ProductsModule, CartModule, OrderModule, PaymentModule
```

Thêm `AddressModule` vào cuối list (sau `PaymentModule`) hoặc sau `UsersModule` (logical grouping — địa chỉ thuộc về user).

---

## State of the Art

| Old Approach                    | Current Approach           | Khi thay đổi       | Impact                                  |
| ------------------------------- | -------------------------- | ------------------ | --------------------------------------- |
| `nanoid()` default export (CJS) | Named export `{ nanoid }`  | nanoid v2 → v3     | Dùng named export, không default        |
| Sequential DB updates           | `Promise.all()` trong tx   | Prisma 2+          | Parallel decrements, faster transaction |
| Manual skip/take tính toán      | `PaginationDto.skip/.take` | Project convention | DRY, validated, consistent              |

---

## Open Questions

1. **`updateItem` controller handler — dùng `@HttpCode` hay conditional return?**
   - What we know: SPEC yêu cầu qty=0 → 204, qty>0 → 200. Một handler không thể return hai status code khác nhau qua decorator.
   - What's unclear: Cách implement single handler cho cả hai cases.
   - Recommendation: **Tách thành hai cách tiếp cận:**
     - Option A: Controller kiểm tra `dto.quantity === 0` và dùng `res.status(204).send()` (inject `@Res()`) — phức tạp, bypass interceptor.
     - Option B: Dùng `@HttpCode(200)` mặc định, nhưng service trả về `void` khi qty=0, và interceptor check `statusCode === 204` không trigger vì status vẫn là 200. Kết quả: trả về `{ statusCode: 200, success: true, message: '...' }` — không khớp SPEC.
     - **Option C (recommended):** Inject `@Res({ passthrough: true })` và `response.status(HttpStatus.NO_CONTENT)` khi qty=0, giữ passthrough để interceptor vẫn chạy. Interceptor sẽ thấy statusCode=204 và return empty.
     - Planner cần quyết định approach này.

2. **`GET /orders` — user thấy gì?**
   - What we know: SPEC nói "user sees own orders, admin/staff see all" (line 59). `OrderService.findAll` đã có `role === UserRole.user ? { userId } : {}` logic.
   - What's unclear: Không cần thay đổi filtering logic, chỉ thêm pagination.
   - Recommendation: Giữ nguyên where clause, chỉ thêm `skip/take/count`.

---

## Environment Availability

| Dependency | Required By            | Available         | Version             | Fallback |
| ---------- | ---------------------- | ----------------- | ------------------- | -------- |
| PostgreSQL | Prisma ORM             | Assumed ✓         | (không probe)       | —        |
| Node.js    | NestJS runtime         | ✓                 | Project requirement | —        |
| npm        | nanoid installation    | ✓                 | Project requirement | —        |
| nanoid@3   | orderNumber generation | ✗ (not installed) | 3.3.12 on registry  | —        |

**Missing dependencies với no fallback:**

- `nanoid@3` — chưa được cài, cần `npm install nanoid@3` trong Wave 0

---

## Assumptions Log

| #   | Claim                                                                | Section                  | Risk if Wrong                                  |
| --- | -------------------------------------------------------------------- | ------------------------ | ---------------------------------------------- |
| A1  | PostgreSQL đang chạy và database đã migrate                          | Environment Availability | Build pass nhưng runtime fail — cần DB để test |
| A2  | `nyquist_validation: false` → bỏ qua Validation Architecture section | (omitted section)        | Low risk — config đọc trực tiếp                |

**Tất cả claims kỹ thuật khác đều VERIFIED từ codebase hoặc npm registry.**

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md tại project root chỉ chứa agent skill references (issue tracker, triage labels, domain docs) — không có coding convention restrictions cụ thể nào ảnh hưởng đến implementation phase này.

**Actionable directives không có.**

---

## Sources

### Primary (HIGH confidence)

- `src/modules/order/order.service.ts` — Bug locations verified at lines 29-65
- `src/modules/cart/cart.service.ts` — Bug location verified at lines 47-50
- `src/common/interceptors/transform-response.interceptor.ts` — Insert point verified at line 43
- `src/modules/cart/cart.controller.ts` — Swagger/guard pattern reference verified
- `src/common/dto/pagination.dto.ts` — `skip`/`take` getters verified; `createPaginatedResult` format noted
- `prisma/schema.prisma:104-122` — Address model: all 8 fields + isDefault confirmed
- `package.json` — No `"type": "module"` field (CommonJS default confirmed); nanoid not installed
- `src/app.module.ts` — Current `imports[]` list verified
- `npm view nanoid@3.3.12` — Version 3.3.12, author ai, repo github.com/ai/nanoid, no postinstall

### Secondary (MEDIUM confidence)

- `src/modules/users/users.service.ts:42-80` — `findAll` pagination pattern (Promise.all + count)
- `src/modules/cart/cart.module.ts` — Module structure pattern confirmed

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — tất cả packages verified từ `package.json` và npm registry
- Architecture: HIGH — tất cả patterns extracted từ codebase thực tế
- Bug locations: HIGH — verified line-by-line từ source files
- Pitfalls: HIGH — derived from code inspection, không phải training data

**Research date:** 2026-05-17
**Valid until:** 2026-06-17 (stable NestJS/Prisma ecosystem)
