# Testing Patterns

**Analysis Date:** 2026-05-15

## Test Framework

**Runner:**

- Jest 29
- Config: embedded in `package.json` under `"jest"` key
- Transform: `ts-jest` (TypeScript transpiled by ts-jest, not SWC, for unit tests)

**Assertion Library:**

- Jest built-in (`expect`)

**Run Commands:**

```bash
npm run test              # Run all unit tests (src/**/*.spec.ts)
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report → coverage/
npm run test:e2e          # E2E tests (test/**/*.e2e-spec.ts)
npm run test:debug        # Debug mode with --inspect-brk
```

## Test File Organization

**Unit tests:**

- Co-located with source files in `src/`
- Naming: `<filename>.spec.ts` (e.g., `slug.util.spec.ts` next to `slug.util.ts`)
- rootDir for Jest: `src/`
- testRegex: `.*\.spec\.ts$`

**E2E tests:**

- Separate `test/` directory at project root
- Naming: `<name>.e2e-spec.ts`
- Config: `test/jest-e2e.json` (separate Jest config, no moduleNameMapper)
- testRegex: `.e2e-spec.ts$`

**Current test files:**

```
src/app.controller.spec.ts
src/common/utils/category-tree.util.spec.ts
src/common/utils/duration.util.spec.ts
src/common/utils/slug.util.spec.ts
src/common/utils/token-hash.util.spec.ts
src/modules/order/order-transitions.util.spec.ts
test/app.e2e-spec.ts
```

## Test Structure

**Suite Organization:**

Unit tests for pure utilities follow a flat `describe` + `it` pattern:

```typescript
import { generateSlug } from './slug.util';

describe('generateSlug', () => {
  it('converts to lowercase and replaces spaces with hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('returns empty string for blank input', () => {
    expect(generateSlug('')).toBe('');
  });
});
```

Multiple `describe` blocks per file when testing multiple exported functions:

```typescript
// src/common/utils/category-tree.util.spec.ts
describe('buildCategoryTree', () => { ... });
describe('applyDepthLimit', () => { ... });
```

NestJS module tests use `beforeEach` with `Test.createTestingModule`:

```typescript
// src/app.controller.spec.ts
describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
```

**Patterns:**

- Setup: `beforeEach` for NestJS module compilation; none needed for pure function tests
- Teardown: Not observed — no `afterEach`/`afterAll` cleanup in current tests
- Assertions: single `expect(...)` per `it` block preferred; multiple allowed when asserting complex state

## Mocking

**Framework:** Jest built-in (`jest.fn()`, `jest.spyOn()`, `jest.mock()`)

**Current state:** No mocking observed in existing tests — all tested code is pure functions with no dependencies (utilities only). NestJS service tests with mocked dependencies have not been written yet.

**Expected pattern for NestJS service tests** (consistent with `@nestjs/testing` usage in `app.controller.spec.ts`):

```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const app: TestingModule = await Test.createTestingModule({
  providers: [AuthService, { provide: PrismaService, useValue: mockPrismaService }],
}).compile();
```

**What to Mock:**

- `PrismaService` — never hit a real DB in unit tests
- `JwtService`, `ConfigService`, `EmailVerificationService` — external/async dependencies
- Any service injected into the class under test

**What NOT to Mock:**

- The class under test itself
- Pure utility functions (test them directly)

## Fixtures and Factories

**Test Data — observed pattern:**

Factory functions defined at the top of spec files, typed with domain interfaces:

```typescript
// src/common/utils/category-tree.util.spec.ts
const row = (id: number, parentId: number | null): CategoryRow => ({
  id,
  name: `Cat ${id}`,
  slug: `cat-${id}`,
  description: null,
  image: null,
  parentId,
  isActive: true,
});

// Usage in tests:
const rows = [row(1, null), row(2, 1), row(3, 1)];
```

**Location:**

- Inline factory functions at top of each `.spec.ts` file — no shared fixtures directory
- No dedicated `__fixtures__/` or `test/factories/` directory exists

## Coverage

**Configuration:**

```json
"collectCoverageFrom": ["**/*.(t|j)s"],
"coverageDirectory": "../coverage"
```

**Requirements:** No minimum threshold configured — coverage is collected but not enforced

**View Coverage:**

```bash
npm run test:cov
# HTML report at: coverage/lcov-report/index.html
```

**Current coverage scope:** Only utility functions are tested. Services, controllers, guards, interceptors, filters have no unit tests.

## Test Types

**Unit Tests (`*.spec.ts`):**

- Scope: Pure utility functions in `src/common/utils/` and `src/modules/order/order-transitions.util.ts`
- Approach: Synchronous function calls, no I/O, no mocking needed
- Framework: Jest + ts-jest

**Integration/Module Tests:**

- `src/app.controller.spec.ts` creates a real `TestingModule` with actual `AppService` — minimal integration test
- No database integration tests exist

**E2E Tests (`*.e2e-spec.ts`):**

- Framework: Jest + supertest
- Location: `test/`
- Config: `test/jest-e2e.json`
- Current coverage: Single smoke test on `GET /` returning `Hello World!`
- Pattern: Creates full `INestApplication`, sends HTTP requests via supertest

## Common Patterns

**Parameterized Tests:**

`it.each` is used for table-driven tests with multiple inputs:

```typescript
// src/common/utils/duration.util.spec.ts
describe('parseDurationMs', () => {
  it.each([
    ['7d', 7 * 24 * 60 * 60 * 1000],
    ['2h', 2 * 60 * 60 * 1000],
    ['15m', 15 * 60 * 1000],
    ['30s', 30 * 1000],
  ])('parses %s correctly', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });
});
```

**Looping assertions over enum values:**

```typescript
// src/modules/order/order-transitions.util.spec.ts
it('nobody can transition from delivered', () => {
  for (const actor of ['system', UserRole.user, UserRole.staff, UserRole.admin] as const) {
    expect(canTransition(OrderStatus.delivered, OrderStatus.cancelled, actor)).toBe(false);
  }
});
```

**Immutability assertions:**

```typescript
it('does not mutate the input rows', () => {
  const rows = [row(1, null), row(2, 1)];
  const original = JSON.stringify(rows);
  buildCategoryTree(rows);
  expect(JSON.stringify(rows)).toBe(original);
});
```

**Async Testing:**

For NestJS module tests, async is handled in `beforeEach`:

```typescript
beforeEach(async () => {
  const app: TestingModule = await Test.createTestingModule({ ... }).compile();
});
```

For E2E tests with supertest, return the promise directly:

```typescript
it('/ (GET)', () => {
  return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
});
```

**Error Testing:**

- Not yet observed in existing spec files
- Expected pattern for NestJS service error tests:

```typescript
it('throws NotFoundException when category not found', async () => {
  mockPrismaService.category.findUnique.mockResolvedValue(null);
  await expect(service.create(dto)).rejects.toThrow(NotFoundException);
});
```

## Module Name Mapper (Path Aliases in Tests)

Jest resolves path aliases via `moduleNameMapper` in `package.json`:

```json
"moduleNameMapper": {
  "@common/(.*)": "<rootDir>/common/$1",
  "@modules/(.*)": "<rootDir>/modules/$1",
  "@config/(.*)": "<rootDir>/config/$1"
}
```

E2E `jest-e2e.json` does NOT include `moduleNameMapper` — tests in `test/` must use relative imports.

---

_Testing analysis: 2026-05-15_
