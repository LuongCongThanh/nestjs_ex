# Phase 2: Order, Cart & Address — Pattern Map

**Mapped:** 2026-05-17
**Files analyzed:** 10 (5 new, 5 modified)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/modules/addresses/addresses.module.ts` | module | — | `src/modules/cart/cart.module.ts` | exact |
| `src/modules/addresses/addresses.controller.ts` | controller | request-response | `src/modules/cart/cart.controller.ts` | exact |
| `src/modules/addresses/addresses.service.ts` | service | CRUD + transaction | `src/modules/cart/cart.service.ts` | role-match |
| `src/modules/addresses/dto/create-address.dto.ts` | dto | — | `src/modules/categories/dto/create-category.dto.ts` | exact |
| `src/modules/addresses/dto/update-address.dto.ts` | dto | — | `src/modules/categories/dto/update-category.dto.ts` | exact |
| `src/modules/order/order.service.ts` | service | CRUD + transaction | `src/modules/order/order.service.ts` (self) | self |
| `src/modules/order/dto/create-order.dto.ts` | dto | — | `src/modules/order/dto/create-order.dto.ts` (self) | self |
| `src/modules/cart/cart.service.ts` | service | request-response | `src/modules/cart/cart.service.ts` (self) | self |
| `src/common/interceptors/transform-response.interceptor.ts` | interceptor | request-response | `src/common/interceptors/transform-response.interceptor.ts` (self) | self |
| `src/app.module.ts` | config | — | `src/app.module.ts` (self) | self |

---

## Pattern Assignments

### `src/modules/addresses/addresses.module.ts` (module)

**Analog:** `src/modules/cart/cart.module.ts`

**Full module pattern** (lines 1–12):
```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
```

**Instructions for new file:**
- Replace `Cart` with `Address` throughout.
- Keep `exports: [AddressService]` — other modules (e.g., OrderModule) may need to resolve addresses.
- Import path for PrismaModule: `'../../prisma/prisma.module'` (same depth as cart/).

---

### `src/modules/addresses/addresses.controller.ts` (controller, request-response)

**Analog:** `src/modules/cart/cart.controller.ts`

**Imports pattern** (lines 1–21):
```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from '@common/decorators/get-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
```

**Class-level auth guard pattern** (lines 22–26 of cart.controller.ts):
```typescript
@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}
```

**Route handler patterns** (lines 29–59 of cart.controller.ts — adapt for addresses):
```typescript
  // GET /users/me/addresses
  @Get()
  @ApiOperation({ summary: 'Get my addresses' })
  findAll(@GetUser() user: User) {
    return this.addressService.findAll(user.id);
  }

  // POST /users/me/addresses
  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  create(@GetUser() user: User, @Body() dto: CreateAddressDto) {
    return this.addressService.create(user.id, dto);
  }

  // PATCH /users/me/addresses/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  update(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(user.id, id, dto);
  }

  // DELETE /users/me/addresses/:id  →  204 No Content
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address' })
  remove(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressService.remove(user.id, id);
  }
```

**Key differences from CartController:**
- `@Controller('users/me/addresses')` not `'cart'`.
- Path params are UUIDs — use `ParseUUIDPipe` (not `ParseIntPipe`).
- DELETE returns 204, so add `@HttpCode(HttpStatus.NO_CONTENT)`.
- No `RolesGuard` needed — all routes are user-scoped.

---

### `src/modules/addresses/addresses.service.ts` (service, CRUD + transaction)

**Analog:** `src/modules/cart/cart.service.ts` (ownership-guard pattern) + `src/modules/order/order.service.ts` (transaction pattern)

**Constructor pattern** (cart.service.ts lines 1–8):
```typescript
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}
```

**findAll — user-scoped list** (modeled on cart.service.ts line 10):
```typescript
  async findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
```

**create with optional isDefault toggle** (transaction pattern from order.service.ts line 29):
```typescript
  async create(userId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({ data: { ...dto, userId } });
    });
  }
```

**Ownership guard pattern** (modeled on cart.service.ts lines 75–84):
```typescript
  private async findOwnedAddress(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException('Address does not belong to you');
    return address;
  }
```

**update with atomic default toggle** (transaction pattern):
```typescript
  async update(userId: string, id: string, dto: UpdateAddressDto) {
    await this.findOwnedAddress(userId, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.update({ where: { id }, data: dto });
    });
  }
```

**remove with default-block** (BadRequestException pattern from order.service.ts):
```typescript
  async remove(userId: string, id: string) {
    const address = await this.findOwnedAddress(userId, id);
    if (address.isDefault) {
      throw new BadRequestException('Cannot delete the default address');
    }
    await this.prisma.address.delete({ where: { id } });
  }
```

---

### `src/modules/addresses/dto/create-address.dto.ts` (dto)

**Analog:** `src/modules/categories/dto/create-category.dto.ts`

**Imports pattern** (create-category.dto.ts lines 1–2):
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
```

**Field declaration pattern** (create-category.dto.ts lines 4–56):
```typescript
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

**Convention notes:**
- Required fields: `@ApiProperty` (no Optional suffix).
- Optional fields: `@ApiPropertyOptional` + `@IsOptional()` + `?` on property.
- Mirrors schema: `ward`, `district`, `postalCode` are `String?` in Prisma → optional here.

---

### `src/modules/addresses/dto/update-address.dto.ts` (dto)

**Analog:** `src/modules/categories/dto/update-category.dto.ts` (lines 1–4)

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from './create-address.dto';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
```

**Convention note:** Use `PartialType` from `@nestjs/swagger` (not `@nestjs/mapped-types`) — this is what the existing codebase uses, as confirmed in update-category.dto.ts line 1.

---

### `src/modules/order/order.service.ts` — Bug Fixes (service, CRUD + transaction)

**Analog:** self — modify the existing file at the 4 known bug locations.

**Bug 1 — orderNumber (line 30):** Replace:
```typescript
// BEFORE (line 30)
const orderNumber = `ORD-${Date.now()}`;
```
With:
```typescript
// AFTER — add import { nanoid } from 'nanoid' at top of file
import { nanoid } from 'nanoid';

const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;
```

**Bug 2 — stock check + decrement (inside transaction, after line 29):** Insert before `tx.order.create`:
```typescript
// Fetch current stock for all products in cart
const productIds = cart.items.map((item) => item.productId);
const products = await tx.product.findMany({ where: { id: { in: productIds } } });
const productMap = new Map(products.map((p) => [p.id, p]));

// Stock check — throw BEFORE creating any order rows
for (const item of cart.items) {
  const product = productMap.get(item.productId)!;
  if (product.stock < item.quantity) {
    throw new BadRequestException(
      `Insufficient stock for: ${product.name} (requested ${item.quantity}, available ${product.stock})`,
    );
  }
}
```

After `tx.order.create` call (before `tx.cartItem.deleteMany`), add atomic decrements:
```typescript
// Atomic parallel stock decrement
await Promise.all(
  cart.items.map((item) =>
    tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    }),
  ),
);
```

**Bug 3 — addressId + snapshot (lines 38–39):** Replace the `shippingAddressSnapshot: dto.shippingAddress` assignment. Inside the transaction, before `tx.order.create`:
```typescript
// Resolve address and verify ownership
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
Then in `tx.order.create` data: `shippingAddressSnapshot: snapshot`.

**Bug 4 — paginated findAll (lines 59–65):** Replace entire `findAll` method:
```typescript
async findAll(userId: string, role: UserRole, query: PaginationDto) {
  const where = role === UserRole.user ? { userId } : {};
  const [data, total] = await Promise.all([
    this.prisma.order.findMany({
      where,
      skip: query.skip,   // PaginationDto getter: (page-1)*limit
      take: query.take,   // PaginationDto getter: limit
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

**Additional imports needed at top of order.service.ts:**
```typescript
import { nanoid } from 'nanoid';
import { PaginationDto } from '../../common/dto/pagination.dto';
// NotFoundException and ForbiddenException already imported on line 1
```

---

### `src/modules/order/dto/create-order.dto.ts` — Migration (dto)

**Analog:** self — replace existing file content entirely.

**Before (current lines 1–14):**
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Shipping address snapshot' })
  @IsObject()
  shippingAddress: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Please leave at the door' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
```

**After — full replacement:**
```typescript
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

**Key changes:** Remove `@IsObject()` + `shippingAddress`. Add `@IsUUID()` + `addressId`. Remove `IsObject` from imports, add `IsUUID`.

---

### `src/modules/cart/cart.service.ts` — Bug Fix (service, request-response)

**Analog:** self — modify `updateItemQuantity` at lines 44–57.

**Before (lines 44–50 — the bug):**
```typescript
async updateItemQuantity(userId: string, itemId: number, dto: UpdateCartItemDto) {
  const item = await this.findItemBelongingToUser(userId, itemId);

  if (dto.quantity === 0) {
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return null;   // BUG: controller sends 200 + null body
  }
```

**After — change return type and remove `return null`:**
```typescript
async updateItemQuantity(userId: string, itemId: number, dto: UpdateCartItemDto): Promise<object | void> {
  const item = await this.findItemBelongingToUser(userId, itemId);

  if (dto.quantity === 0) {
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return;   // void — controller must set 204 via response object
  }
```

**Controller fix also required** — in `cart.controller.ts`, the `updateItem` handler (line 42) needs the `@Res({ passthrough: true })` + conditional status pattern (Open Question from RESEARCH.md, Option C):
```typescript
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Patch('items/:id')
@ApiOperation({ summary: 'Update cart item quantity (0 = remove)' })
async updateItem(
  @GetUser() user: User,
  @Param('id', ParseIntPipe) itemId: number,
  @Body() dto: UpdateCartItemDto,
  @Res({ passthrough: true }) res: Response,
) {
  const result = await this.cartService.updateItemQuantity(user.id, itemId, dto);
  if (result === undefined) {
    res.status(HttpStatus.NO_CONTENT);
    return;
  }
  return result;
}
```

**Why Option C (not @HttpCode):** A single handler cannot serve both 200 and 204 via a static decorator. `@Res({ passthrough: true })` keeps the interceptor active so the 204 check in the interceptor fires correctly.

---

### `src/common/interceptors/transform-response.interceptor.ts` — 204 Bypass (interceptor)

**Analog:** self — single insertion at line 44.

**Exact insert location** (lines 43–55 — the `map` callback):
```typescript
return next.handle().pipe(
  map((data: unknown) => {
    const statusCode = response.statusCode;

    // [INSERT HERE — line 46, before any existing logic]
    if (statusCode === 204) {
      return undefined as unknown as Response<T>;
    }

    // If data is null or undefined, return simple success message  ← existing line 48
    if (data === null || data === undefined) {
```

**Full corrected block** (lines 43–76 after fix):
```typescript
return next.handle().pipe(
  map((data: unknown) => {
    const statusCode = response.statusCode;

    // 204 No Content — bypass wrapping, return empty body
    if (statusCode === 204) {
      return undefined as unknown as Response<T>;
    }

    // If data is null or undefined, return simple success message
    if (data === null || data === undefined) {
      return {
        statusCode,
        success: true,
        message: this.getDefaultMessage(method, path),
      };
    }

    // If data already has success/message/data structure, return as is
    if (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      'message' in (data as Record<string, unknown>)
    ) {
      return {
        statusCode,
        ...(data as any),
      } as Response<T>;
    }

    // Wrap data in standard format
    return {
      statusCode,
      success: true,
      message,
      data: data as T,
    };
  }),
);
```

**No import changes needed** — `map` from `rxjs/operators` is already imported (line 4).

---

### `src/app.module.ts` — Register AddressModule (config)

**Analog:** self — add one import declaration and one entry in `imports[]`.

**Import to add** (after line 7, alongside other module imports):
```typescript
import { AddressModule } from './modules/addresses/addresses.module';
```

**Array entry to add** (line 38 — after `UsersModule`, logical grouping by domain):
```typescript
    UsersModule,
    AddressModule,    // ← add here
    CategoriesModule,
```

---

## Shared Patterns

### Authentication (class-level guard)

**Source:** `src/modules/cart/cart.controller.ts` lines 22–24
**Apply to:** `addresses.controller.ts` (class level)
```typescript
@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/addresses')
export class AddressController { ... }
```

### User Extraction from JWT

**Source:** `src/modules/cart/cart.controller.ts` lines 31, 37, 43
**Apply to:** All handler methods in `addresses.controller.ts`, modified handlers in `order.controller.ts`
```typescript
// In handler signature:
@GetUser() user: User

// In service call:
this.addressService.create(user.id, dto)
```

### UUID Path Param Validation

**Source:** NestJS built-in, pattern established by `src/modules/users/users.controller.ts`
**Apply to:** `addresses.controller.ts` PATCH and DELETE handlers
```typescript
@Param('id', ParseUUIDPipe) id: string
```

### Ownership Guard (findUnique + userId check)

**Source:** `src/modules/cart/cart.service.ts` lines 75–84 (`findItemBelongingToUser`)
**Apply to:** `addresses.service.ts` private helper method
```typescript
private async findOwnedAddress(userId: string, id: string) {
  const address = await this.prisma.address.findUnique({ where: { id } });
  if (!address) throw new NotFoundException('Address not found');
  if (address.userId !== userId) throw new ForbiddenException('Address does not belong to you');
  return address;
}
```

### Prisma Transaction

**Source:** `src/modules/order/order.service.ts` line 29
**Apply to:** `addresses.service.ts` (create + update when isDefault=true), `order.service.ts` (stock decrement)
```typescript
return this.prisma.$transaction(async (tx) => {
  // all operations use tx.*, not this.prisma.*
});
```

### DTO PartialType Pattern (update DTOs)

**Source:** `src/modules/categories/dto/update-category.dto.ts` lines 1–4
**Apply to:** `addresses/dto/update-address.dto.ts`
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from './create-address.dto';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
```

### PaginationDto Reuse

**Source:** `src/common/dto/pagination.dto.ts` lines 5–39
**Apply to:** `order.service.ts` `findAll` signature, `order.controller.ts` `findAll` handler
```typescript
// Controller — inject as @Query()
@Get()
findAll(@GetUser() user: User, @Query() query: PaginationDto) {
  return this.orderService.findAll(user.id, user.role as UserRole, query);
}

// Service — use getters (NOT raw page/limit)
skip: query.skip,   // computed getter: (page ?? 1 - 1) * (limit ?? 10)
take: query.take,   // computed getter: limit ?? 10
```

---

## No Analog Found

All files have analogs in the codebase. No greenfield patterns needed.

---

## Metadata

**Analog search scope:** `src/modules/cart/`, `src/modules/order/`, `src/modules/categories/`, `src/modules/users/`, `src/common/interceptors/`, `src/common/dto/`, `src/app.module.ts`
**Files scanned:** 12
**Pattern extraction date:** 2026-05-17

### Critical Implementation Notes for Planner

1. **nanoid import must be at file top** — `import { nanoid } from 'nanoid';` (named export, not default). Install first: `npm install nanoid@3`.
2. **PaginationDto getters** — use `query.skip` and `query.take` (computed getters). Do NOT calculate `(page-1)*limit` inline.
3. **Flat pagination response** — SPEC requires `{ data, page, limit, total }`. Do NOT call `createPaginatedResult()` which returns nested `{ data, meta: { ... } }`.
4. **snapshot from DB, not DTO** — `shippingAddressSnapshot` must be built from the `address` record fetched inside the transaction. Map exactly 8 fields explicitly; do not spread the full object.
5. **204 handler** — `updateItem` in CartController cannot use `@HttpCode(204)` alone because it also serves 200 responses. Use `@Res({ passthrough: true })` + conditional `res.status(204)` so the interceptor still fires and sees statusCode=204.
6. **Order controller `findAll` signature change** — add `@Query() query: PaginationDto` parameter to forward to service. Import `PaginationDto` and `Query` decorator.
