# ### ✅ TASK 02: Setup Environment & Configuration

> **Task Number:** 02  
> **Priority:** Core  
> **Status:** ⬜ Not Started  
> **Dependencies:** Task 01 (phải hoàn thành trước)

---

## 🎯 **Mục tiêu**

Cấu hình **ConfigModule** với validation, setup **TypeORM DataSource**, và tạo **Health Check** endpoint để verify database connection.

**⚠️ Lưu ý:** Task 01 đã tạo `.env` và `.env.example` rồi. Task này sẽ **extend** và **validate** các env vars đó.

---

## 📋 **Các bước thực hiện**

### **STEP 1: Install Dependencies**

```bash
npm install joi
npm install --save-dev @types/node
```

**Giải thích:**

- `joi`: Validation schema cho environment variables
- `@types/node`: Type definitions cho process.env

---

### **STEP 2: Verify và Update .env File**

**File:** `ecommerce-api/.env`

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=ecommerce_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DEST=./uploads

# Pagination
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

**⚠️ Security Notes:**

- `JWT_SECRET` phải **ít nhất 32 ký tự**
- Không commit file `.env` vào git
- Production phải dùng secrets manager (AWS Secrets, Azure Key Vault, etc.)

---

### **STEP 3: Create Environment Validation Schema**

**File:** `src/config/env.validation.ts`

```typescript
import * as Joi from "joi";

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid("development", "production", "test", "staging")
    .default("development"),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default("api/v1"),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().messages({
    "string.min": "JWT_SECRET must be at least 32 characters for security",
    "any.required": "JWT_SECRET is required",
  }),
  JWT_EXPIRATION: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default("7d")
    .messages({
      "string.pattern.base":
        "JWT_EXPIRATION must be in format: 1d, 7d, 24h, 60m, etc.",
    }),
  JWT_REFRESH_EXPIRATION: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default("30d"),

  // CORS
  CORS_ORIGIN: Joi.string().default("http://localhost:3000"),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Upload
  MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB
  UPLOAD_DEST: Joi.string().default("./uploads"),

  // Pagination
  DEFAULT_PAGE_SIZE: Joi.number().default(10),
  MAX_PAGE_SIZE: Joi.number().default(100),
});
```

**Tại sao cần validation:**

- ✅ App crash sớm nếu thiếu env vars → tránh runtime errors
- ✅ Type safety và default values
- ✅ Clear error messages
- ✅ Documentation cho environment variables

---

### **STEP 4: Create TypeORM Configuration**

**File:** `src/config/typeorm.config.ts`

```typescript
import { DataSource, DataSourceOptions } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";

// Load .env for TypeORM CLI
config();

/**
 * Get TypeORM configuration for NestJS runtime
 */
export const getTypeOrmConfig = (
  configService: ConfigService
): DataSourceOptions => ({
  type: "postgres",
  host: configService.get("DB_HOST"),
  port: configService.get("DB_PORT"),
  username: configService.get("DB_USERNAME"),
  password: configService.get("DB_PASSWORD"),
  database: configService.get("DB_DATABASE"),
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  synchronize: configService.get("NODE_ENV") === "development",
  logging: configService.get("NODE_ENV") === "development",
  ssl:
    configService.get("NODE_ENV") === "production"
      ? { rejectUnauthorized: false }
      : false,
});

/**
 * DataSource for TypeORM CLI (migrations)
 */
export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  synchronize: false, // Always false for migrations
  logging: process.env.NODE_ENV === "development",
});
```

**Giải thích:**

- `getTypeOrmConfig()`: Dùng cho NestJS runtime với ConfigService
- `export default new DataSource()`: Dùng cho TypeORM CLI commands
- `synchronize: false` trong DataSource → phải dùng migrations
- SSL enabled cho production

---

### **STEP 5: Update AppModule**

**File:** `src/app.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { validationSchema } from "./config/env.validation";
import { getTypeOrmConfig } from "./config/typeorm.config";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    // Config Module - Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}`, // Specific environment
        ".env", // Fallback
      ],
      validationSchema,
      validationOptions: {
        abortEarly: true, // Stop on first error
      },
    }),

    // TypeORM Module - Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
    }),

    // Health Check Module
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Tại sao dùng `forRootAsync`:**

- ✅ Inject ConfigService vào TypeORM config
- ✅ Async initialization
- ✅ Clean separation of concerns

---

### **STEP 6: Create Health Check Module**

**File:** `src/health/health.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

**File:** `src/health/health.controller.ts`

```typescript
import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DataSource } from "typeorm";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({
    status: 200,
    description: "Service is healthy",
    schema: {
      example: {
        status: "ok",
        timestamp: "2026-01-10T10:30:00.000Z",
        database: "connected",
        uptime: 123.456,
      },
    },
  })
  async check() {
    try {
      const isConnected = this.dataSource.isInitialized;

      return {
        status: isConnected ? "ok" : "error",
        timestamp: new Date().toISOString(),
        database: isConnected ? "connected" : "disconnected",
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        message: error.message,
      };
    }
  }
}
```

---

### **STEP 7: Add Migration Scripts to package.json**

**File:** `package.json`

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",

    "typeorm": "typeorm-ts-node-commonjs",
    "migration:create": "typeorm migration:create src/migrations/Migration",
    "migration:generate": "npm run typeorm -- migration:generate src/migrations/Migration -d src/config/typeorm.config.ts",
    "migration:run": "npm run typeorm -- migration:run -d src/config/typeorm.config.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d src/config/typeorm.config.ts",
    "migration:show": "npm run typeorm -- migration:show -d src/config/typeorm.config.ts"
  }
}
```

**Giải thích scripts:**

- `migration:create`: Tạo migration file rỗng
- `migration:generate`: Tự động generate từ entity changes
- `migration:run`: Chạy pending migrations
- `migration:revert`: Rollback migration cuối cùng
- `migration:show`: Xem trạng thái migrations

---

### **STEP 8: Update main.ts**

**File:** `src/main.ts`

```typescript
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get ConfigService
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix(configService.get("API_PREFIX"));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS
  app.enableCors({
    origin: configService.get("CORS_ORIGIN").split(","),
    credentials: true,
  });

  const port = configService.get("PORT");
  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${configService.get(
      "API_PREFIX"
    )}`
  );
  console.log(`🏥 Health check: http://localhost:${port}/health`);
}
bootstrap();
```

---

## ✅ **Verification & Testing**

### **Test 1: Successful Startup**

```bash
# Start application
npm run start:dev

# Expected output:
# ✅ ConfigModule loaded successfully
# ✅ Database connected successfully
# 🚀 Application is running on: http://localhost:3000/api/v1
# 🏥 Health check: http://localhost:3000/health
```

---

### **Test 2: Health Check Endpoint**

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-01-10T10:30:00.000Z",
  "database": "connected",
  "uptime": 123.456,
  "environment": "development"
}
```

---

### **Test 3: Missing Environment Variable**

```bash
# 1. Temporarily remove DB_HOST from .env
# 2. Start application
npm run start:dev

# Expected output:
# ❌ Error: "DB_HOST" is required
# ❌ Application failed to start
```

---

### **Test 4: Invalid JWT_SECRET Length**

```bash
# 1. Set JWT_SECRET=short in .env (< 32 chars)
# 2. Start application
npm run start:dev

# Expected output:
# ❌ Error: JWT_SECRET must be at least 32 characters for security
# ❌ Application failed to start
```

---

### **Test 5: TypeORM CLI Commands**

```bash
# Show migration status
npm run migration:show

# Expected output:
# [X] Migration1234567890-Initial (ran)
# [ ] Migration1234567891-AddUsers (pending)
```

---

## 📝 **Implementation Checklist**

### **Pre-requisites**

- [x] Task 01 completed (project initialized with .env files)
- [ ] PostgreSQL installed and running
- [ ] Review TypeORM documentation

### **Configuration Setup**

- [ ] Install Joi dependency
- [ ] Create `src/config/env.validation.ts` with full validation schema
- [ ] Create `src/config/typeorm.config.ts` with both NestJS and CLI configs
- [ ] Update `.env` with all required variables
- [ ] Verify `.env` in `.gitignore`

### **AppModule Integration**

- [ ] Import ConfigModule with validation
- [ ] Setup TypeOrmModule.forRootAsync
- [ ] Test application starts successfully
- [ ] Verify no validation errors

### **Health Check**

- [ ] Create `src/health/health.module.ts`
- [ ] Create `src/health/health.controller.ts`
- [ ] Add Swagger documentation
- [ ] Test health endpoint returns correct data

### **Migration Scripts**

- [ ] Add all migration scripts to package.json
- [ ] Test `migration:create` command
- [ ] Test `migration:show` command
- [ ] Document migration workflow

### **Testing**

- [ ] Test 1: Successful startup ✅
- [ ] Test 2: Health check endpoint ✅
- [ ] Test 3: Missing env variable validation ✅
- [ ] Test 4: Invalid JWT_SECRET validation ✅
- [ ] Test 5: TypeORM CLI commands ✅

### **Documentation**

- [ ] Update README.md with environment setup
- [ ] Document all environment variables
- [ ] Add troubleshooting section

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: "Cannot find module 'joi'"**

```bash
# Solution:
npm install joi
```

---

### **Issue 2: TypeORM CLI not working**

```bash
# Error: typeorm-ts-node-commonjs not found

# Solution:
npm install --save-dev ts-node
npm install --save-dev @types/node
```

---

### **Issue 3: Database connection failed**

```bash
# Error: ECONNREFUSED 127.0.0.1:5432

# Solution:
# 1. Check PostgreSQL is running:
sudo systemctl status postgresql

# 2. Check credentials in .env
# 3. Test connection:
psql -h localhost -U postgres -d ecommerce_db
```

---

### **Issue 4: Validation error on startup**

```bash
# Error: "DB_HOST" is required

# Solution:
# 1. Copy .env.example to .env
cp .env.example .env

# 2. Fill in all required values
# 3. Check for typos in variable names
```

---

## 📚 **Additional Resources**

- [NestJS ConfigModule Documentation](https://docs.nestjs.com/techniques/configuration)
- [TypeORM DataSource API](https://typeorm.io/data-source)
- [Joi Validation Documentation](https://joi.dev/api/)
- [NestJS Environment Variables Best Practices](https://docs.nestjs.com/techniques/configuration#custom-env-file-path)

---

## 🎯 **Post-Completion**

- [ ] Update task status to ✅ Done
- [ ] Test all 5 verification scenarios
- [ ] Commit changes with message: `feat: setup ConfigModule with validation and TypeORM`
- [ ] Document any deviations from plan
- [ ] Update Task 03 dependencies

---

## ⏱️ **Time Tracking**

- **Estimated:** 2 hours
- **Actual:** \_\_\_ hours

---

## 📊 **Task Completion Criteria**

✅ ConfigModule với Joi validation hoạt động  
✅ TypeORM DataSource configured cho cả runtime và CLI  
✅ Health check endpoint trả về database status  
✅ Migration scripts trong package.json  
✅ Tất cả 5 test cases pass  
✅ Application start thành công với valid .env  
✅ Application crash với clear error khi thiếu env vars

---

## 🔗 **Related Tasks**

- **Task 01**: Khởi tạo Project (prerequisite)
- **Task 03**: Setup Database PostgreSQL (next)
- **Task 04**: Kết nối NestJS với PostgreSQL (depends on this)
- **Task 11**: Generate & Run Migrations (uses migration scripts from this task)
