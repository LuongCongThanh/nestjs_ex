---
phase: 02-order-cart-address
plan: 02
subsystem: addresses
tags: [addresses, crud, prisma, jwt, nestjs]
dependency_graph:
  requires: [PrismaModule, JwtAuthGuard, GetUser]
  provides: [AddressModule, AddressService, AddressController]
  affects: [AppModule]
tech_stack:
  added: []
  patterns: [prisma-transaction, ownership-guard, partial-type-dto, class-level-guard]
key_files:
  created:
    - src/modules/addresses/addresses.module.ts
    - src/modules/addresses/addresses.controller.ts
    - src/modules/addresses/addresses.service.ts
    - src/modules/addresses/dto/create-address.dto.ts
    - src/modules/addresses/dto/update-address.dto.ts
  modified:
    - src/app.module.ts
decisions:
  - AddressModule exports AddressService for future OrderModule injection
  - PartialType imported from @nestjs/swagger (not @nestjs/mapped-types) per codebase convention
  - Class-level @UseGuards(JwtAuthGuard) covers all 4 address routes
  - $transaction wraps isDefault toggle to prevent dual-default race condition
metrics:
  duration: ~10 minutes
  completed: 2026-05-17
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 1
---

# Phase 02 Plan 02: AddressModule — Summary

**One-liner:** Complete AddressModule with CRUD, atomic isDefault toggle via Prisma transaction, ownership guard returning 403/404, and 400-on-default-delete protection.

## Files Created

| File | Purpose |
|------|---------|
| `src/modules/addresses/addresses.module.ts` | NestJS module; imports PrismaModule; exports AddressService |
| `src/modules/addresses/addresses.controller.ts` | 4 REST handlers under `/users/me/addresses` with class-level JwtAuthGuard |
| `src/modules/addresses/addresses.service.ts` | CRUD service with transaction-based isDefault toggle and ownership guard |
| `src/modules/addresses/dto/create-address.dto.ts` | CreateAddressDto with 9 fields (4 optional: ward, district, postalCode, isDefault) |
| `src/modules/addresses/dto/update-address.dto.ts` | UpdateAddressDto extends PartialType(CreateAddressDto) from @nestjs/swagger |

## AppModule Diff

```diff
+ import { AddressModule } from './modules/addresses/addresses.module';

  imports: [
    ...
    UsersModule,
+   AddressModule,
    CategoriesModule,
    ...
  ]
```

Single import line added, single entry in `imports[]` after UsersModule.

## Four Public Service Method Signatures

```typescript
findAll(userId: string): Promise<Address[]>
create(userId: string, dto: CreateAddressDto): Promise<Address>
update(userId: string, id: string, dto: UpdateAddressDto): Promise<Address>
remove(userId: string, id: string): Promise<void>
```

## Deviations from Plan

None — plan executed exactly as written.

All acceptance criteria verified:
- `addresses.module.ts` exists with `imports: [PrismaModule]` and `exports: [AddressService]`
- `create-address.dto.ts` has all 9 fields; exactly ward/district/postalCode/isDefault are optional
- `update-address.dto.ts` imports `PartialType` from `@nestjs/swagger`
- `addresses.service.ts` contains: findAll, create, update, remove, $transaction, updateMany, BadRequestException, ForbiddenException, NotFoundException
- `addresses.controller.ts` has `@Controller('users/me/addresses')` and `@HttpCode(HttpStatus.NO_CONTENT)` on delete handler
- `app.module.ts` imports AddressModule between UsersModule and CategoriesModule
- `npm run build` exits 0

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | `319067b0` | feat(02-02): create AddressModule files (module, DTOs, service) |
| Task 2 | `08d182b3` | feat(02-02): create AddressController and register AddressModule in AppModule |

## Self-Check: PASSED

- `src/modules/addresses/addresses.module.ts` — FOUND
- `src/modules/addresses/addresses.controller.ts` — FOUND
- `src/modules/addresses/addresses.service.ts` — FOUND
- `src/modules/addresses/dto/create-address.dto.ts` — FOUND
- `src/modules/addresses/dto/update-address.dto.ts` — FOUND
- commit `319067b0` — FOUND
- commit `08d182b3` — FOUND
- build — PASSED
