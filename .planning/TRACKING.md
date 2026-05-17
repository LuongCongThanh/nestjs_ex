# Tracking — E-Commerce API Hardening

**Last updated:** 2026-05-18
**Overall progress:** 1/4 phases · 4/4 plans complete (Phase 2)

---

## Phase 1 — Quick Wins: Security Gates & Infra

**Status:** Not started — plans not yet created
**Requirements:** SEC-01, SEC-03, INFRA-01, INFRA-02, INFRA-03

| Plan | Description | Requirements | Status |
|------|-------------|--------------|--------|
| — | Plans TBD | SEC-01, SEC-03, INFRA-01, INFRA-02, INFRA-03 | Not started |

---

## Phase 2 — Order, Cart & Address

**Status:** Complete ✓
**Requirements:** ORD-01, ORD-02, ORD-03, CART-01, ADDR-01, ADDR-02, ADDR-03

| Plan | Description | Wave | Depends on | Requirements | Status |
|------|-------------|------|------------|--------------|--------|
| [02-01](phases/02-order-cart-address/02-01-PLAN.md) | Install nanoid@3 + TransformResponseInterceptor 204 bypass | 1 | — | CART-01 (infra) | Done ✓ |
| [02-02](phases/02-order-cart-address/02-02-PLAN.md) | AddressModule CRUD + atomic isDefault toggle + delete-default guard | 1 | — | ADDR-01, ADDR-02 | Done ✓ |
| [02-03](phases/02-order-cart-address/02-03-PLAN.md) | OrderService: stock decrement + nanoid orderNumber + addressId snapshot + paginated findAll | 2 | 02-01, 02-02 | ORD-01, ORD-02, ORD-03, ADDR-03 | Done ✓ |
| [02-04](phases/02-order-cart-address/02-04-PLAN.md) | Cart PATCH qty=0 → 204 No Content | 2 | 02-01 | CART-01 | Done ✓ |

**Wave execution order:**
- Wave 1: 02-01 và 02-02 chạy song song (không phụ thuộc nhau)
- Wave 2: 02-03 và 02-04 chạy sau khi Wave 1 xong

---

## Phase 3 — Email Transport & Auth Completion

**Status:** Not started — plans not yet created (depends on Phase 1)
**Requirements:** EMAIL-01, AUTH-01, AUTH-02, AUTH-03, SEC-02

| Plan | Description | Requirements | Status |
|------|-------------|--------------|--------|
| — | Plans TBD | EMAIL-01, AUTH-01, AUTH-02, AUTH-03, SEC-02 | Not started |

---

## Phase 4 — Test Coverage: Unit + E2E

**Status:** Not started — plans not yet created (depends on Phase 2 + Phase 3)
**Requirements:** TEST-01, TEST-02, TEST-03

| Plan | Description | Requirements | Status |
|------|-------------|--------------|--------|
| — | Plans TBD | TEST-01, TEST-02, TEST-03 | Not started |

---

## Requirements Coverage

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| SEC-01 | 1 | TBD | Pending |
| SEC-03 | 1 | TBD | Pending |
| INFRA-01 | 1 | TBD | Pending |
| INFRA-02 | 1 | TBD | Pending |
| INFRA-03 | 1 | TBD | Pending |
| CART-01 | 2 | 02-01 + 02-04 | Done ✓ |
| ADDR-01 | 2 | 02-02 | Done ✓ |
| ADDR-02 | 2 | 02-02 | Done ✓ |
| ORD-01 | 2 | 02-03 | Done ✓ |
| ORD-02 | 2 | 02-03 | Done ✓ |
| ORD-03 | 2 | 02-03 | Done ✓ |
| ADDR-03 | 2 | 02-03 | Done ✓ |
| EMAIL-01 | 3 | TBD | Pending |
| AUTH-01 | 3 | TBD | Pending |
| AUTH-02 | 3 | TBD | Pending |
| AUTH-03 | 3 | TBD | Pending |
| SEC-02 | 3 | TBD | Pending |
| TEST-01 | 4 | TBD | Pending |
| TEST-02 | 4 | TBD | Pending |
| TEST-03 | 4 | TBD | Pending |

---

## How to update

Khi hoàn thành một plan, đổi `Not started` → `Done` trong bảng phase tương ứng và tăng counter ở dòng Overall progress. Status options: `Not started` · `In progress` · `Done` · `Blocked`.
