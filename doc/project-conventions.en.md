# 🛠️ Project Conventions & Documentation Standards (Professional Edition)

This document defines the coding standards, documentation patterns, and system architecture for the Ecommerce API project.

---

## 🏗️ 1. Module Architecture & Dependency Injection (DI)

### Standard Module Layout
Every feature should be encapsulated within its own module under `src/modules/`.
```text
src/modules/[module-name]/
├── controllers/          # HTTP request handling
├── services/             # Business Logic
├── dto/                  # Validation (Class-Validator)
├── interfaces/           # Internal types
├── guards/               # Access Control
├── decorators/           # Custom Decorators
├── [module-name].module.ts
└── [module-name].service.spec.ts
```

### Dependency Injection Rules
1.  **Circular Dependency**: Minimize the use of `forwardRef()`. If two modules depend on each other, extract shared logic into a `CommonModule` or `SharedModule`.
2.  **Explicit Exports**: Only export necessary **Services**, never the entire Module unless it's a Global Module.
3.  **Scopes**: Use `DEFAULT` scope (Singleton) by default. Only use `REQUEST` scope if absolutely necessary for performance reasons.

---

## 📐 2. Naming Conventions & Data Structure

| Item | Convention | Example |
| :--- | :--- | :--- |
| **Classes** | PascalCase | `AuthService`, `UserController` |
| **Interfaces** | PascalCase | `JwtPayload`, `UserWithRelations` |
| **Files** | kebab-case | `auth.service.ts`, `get-user.decorator.ts` |
| **Variables/Methods** | camelCase | `getUserById`, `updatedAt` |
| **Constants** | SCREAMING_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |

---

## 🔒 3. Type Safety & Security

1.  **Strict Mode**: `strict: true` is mandatory. Do not use `any` or `unknown`. Must declare types explicitly (e.g., using `interface`, `Pick<T>`, or specific DTOs).
2.  **DTO Validation**: 
    - Every API input must have a DTO.
    - Global Pipe must have `whitelist: true` and `forbidNonWhitelisted: true`.
3.  **Sensitive Data**: Use `class-transformer` (`@Exclude()`) or Interceptors to strip sensitive fields (`password`, `salt`) before returning responses to the client.
4.  **Enums**: Prefer using `enum` for fixed constant values (Role, Status).

---

## 📝 4. Documentation Standards (JSDoc) & API

### JSDoc Standards
- **Classes**: Describe class responsibility.
- **Methods**: Must include `@param`, `@returns`, and `@throws`. Explain **WHY** instead of **WHAT**.

### Swagger (OpenAPI)
- All endpoints must include `@ApiTags`, `@ApiOperation`, and `@ApiResponse`.
- DTOs must use `@ApiProperty` to describe fields and provide examples.

---

## ⚠️ 5. Error Handling Strategy

1.  **Custom Exceptions**: Avoid returning plain text strings. Always use `HttpException` or its subclasses (`NotFoundException`, `BadRequestException`).
2.  **Global Filters**: All unexpected errors must be caught by a Global Exception Filter to provide formatted responses: `{ statusCode, message, timestamp, path }`.

---

## ⚙️ 6. Environment Management

1.  **ConfigService**: Never use `process.env` directly in the code. Always access through `ConfigService`.
2.  **Environment Validation**: All environment variables must be validated (using Joi or Zod) in the `ConfigModule` to ensure the app doesn't start with missing critical configurations.
3.  **`.env.example`**: Always update this file when adding new environment variables.

---

## 📊 7. Logging & Observability

1.  **Correlation ID**: Every request must be attached with a unique `request-id` in logs for easy tracing (use middleware or interceptors).
2.  **Log Levels**:
    - `Error`: Critical errors needing immediate attention.
    - `Warn`: Abnormal situations but the app continues to run.
    - `Info`: Main processing flow of the system.
3.  **No `console.log`**: Only use `Logger` from `@nestjs/common`.

---

## 💎 8. Database Optimization (Prisma Best Practices)

1.  **Selective Fetching**: Always use `select` to fetch necessary fields. Avoid fetching the whole object if not used.
2.  **Transactions**: Mandatory use of Prisma Transactions (`$transaction`) for operations related to Order, Inventory, or interdependent data changes.
3.  **Indexes**: Check and ensure fields used for filtering/sorting are indexed in the schema.

---

## 🧪 9. Testing Standards

- **Unit Tests**: Focus on Service logic. Use `@golevelup/ts-jest` for dependency mocking.
- **E2E Tests**: Focus on critical business flows (Checkout, Auth flow).
- **Pattern**: Arrange-Act-Assert.

---

## 🚀 10. Git Workflow & Merge

- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/).
- **Quality Gate**: PRs must pass `npm run lint` and `npm run build` before merging.

---

**Philosophy**: Code is read much more often than it is written. Write code for the person who will maintain it after you.
