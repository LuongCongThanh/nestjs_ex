# ### ✅ TASK 01: Khởi tạo Project NestJS

> **Task Number:** 01  
> **Priority:** Core  
> **Status:** ⬜ Not Started  
> **Estimated Time:** 1-2 hours

---

## 🎯 Mục Tiêu

Tạo và cấu hình project NestJS cơ bản với cấu trúc thư mục chuẩn, dependencies đầy đủ và Git repository.

---

## ⚙️ System Requirements

**Trước khi bắt đầu, đảm bảo đã cài đặt:**

- ✅ **Node.js**: v20.x hoặc v22.x (LTS recommended, v18 sắp end-of-life)

  ```bash
  node --version  # Check version (expected: v20.x or v22.x)
  # Nếu dùng nvm: nvm use 20
  ```

- ✅ **npm**: v9.x trở lên (hoặc yarn v1.22+)

  ```bash
  npm --version
  ```

- ✅ **Git**: v2.x trở lên

  ```bash
  git --version
  ```

- ✅ **Code Editor**: VS Code (recommended) với extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

**Optional but recommended:**

- PostgreSQL client (pgAdmin, DBeaver) - sẽ cần ở Task 03
- Postman hoặc Insomnia - để test APIs

---

## 📋 Mục Tiêu Task

**Các bước thực hiện:**

### Step 1: Cài đặt NestJS CLI (Ưu tiên npx)

```bash
# RECOMMENDED: Dùng npx (không cần install global, luôn dùng latest version)
npx @nestjs/cli@latest --version
# Expected output: 11.0.x hoặc mới hơn

# ALTERNATIVE: Install globally (chỉ nếu team thống nhất version)
# npm i -g @nestjs/cli
# nest --version
```

**Note:**

- ✅ **npx** tránh version conflicts giữa các projects (best practice 2026)
- ⚠️ Global install chỉ dùng nếu team enforce version cụ thể

---

### Step 2: Tạo Project Mới

```bash
# Navigate to workspace folder
cd E:\my-pj\nestjs_ex

# Create new NestJS project with npx
npx @nestjs/cli@latest new ecommerce-api --package-manager npm --strict

# --strict: Enable TypeScript strict mode (recommended for better type safety)
# Chọn npm làm package manager (hoặc bỏ flag để chọn manual)
```

**NestJS CLI sẽ tự động:**

- Tạo project structure chuẩn
- Cài đặt dependencies cơ bản (@nestjs/core, @nestjs/common, etc.)
- Setup TypeScript config với strict mode
- Tạo Git repository tự động
- Tạo `.gitignore` với Node.js defaults

---

### Step 3: Cài Đặt Core Dependencies

```bash
# Navigate to project
cd ecommerce-api

# Core dependencies với pinned versions (tránh breaking changes)
npm install @nestjs/config@3.2.3 @nestjs/typeorm@10.0.2 typeorm@0.3.20 pg@8.13.1
npm install @nestjs/jwt@10.2.0 @nestjs/passport@10.0.3 passport@0.7.0 passport-jwt@4.0.1
npm install bcryptjs@2.4.3 class-validator@0.14.1 class-transformer@0.5.1
npm install @nestjs/swagger@8.0.4
```

**Giải thích:**

- `@nestjs/config` - Environment variables management
- `@nestjs/typeorm`, `typeorm`, `pg` - ORM + PostgreSQL driver
- `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt` - JWT authentication
- `bcryptjs` - Password hashing (pure JS, no native build như bcrypt)
- `class-validator`, `class-transformer` - DTO validation & transformation
- `@nestjs/swagger` - OpenAPI documentation

---

### Step 4: Cài Đặt Dev Dependencies

```bash
# Type definitions
npm install -D @types/passport-jwt@4.0.1 @types/bcryptjs@2.4.6 @types/node@22.10.2

# ESLint & Prettier (code quality + formatting)
npm install -D eslint@9.18.0 prettier@3.4.2
npm install -D eslint-config-prettier@9.1.0 eslint-plugin-prettier@5.2.1
npm install -D @typescript-eslint/eslint-plugin@8.18.2 @typescript-eslint/parser@8.18.2
```

**Setup ESLint config:**

```bash
# Tạo .eslintrc.js (sau khi cd vào project)
echo 'module.exports = { parser: "@typescript-eslint/parser", extends: ["plugin:@typescript-eslint/recommended", "prettier"], plugins: ["@typescript-eslint", "prettier"], rules: { "prettier/prettier": "error" } };' > .eslintrc.js

# Hoặc tạo thủ công với nội dung:
```

**.eslintrc.js:**

```javascript
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
  },
};
```

---

### Step 5: Tạo Cấu Trúc Thư Mục (Dùng Nest CLI)

```bash
# Tạo feature modules với CLI (auto-register vào app.module.ts)
npx nest g module modules/auth --no-spec
npx nest g module modules/users --no-spec
npx nest g module modules/products --no-spec
npx nest g module modules/categories --no-spec
npx nest g module modules/orders --no-spec
npx nest g module modules/carts --no-spec

# Tạo shared/config folders thủ công
# Windows PowerShell:
mkdir src\config, src\common\dto, src\common\filters, src\common\interceptors, src\common\pipes, src\migrations

# Linux/Mac:
mkdir -p src/{config,common/{dto,filters,interceptors,pipes},migrations}
```

**Lợi ích dùng CLI:**

- ✅ Tự động tạo `*.module.ts` với imports/exports chuẩn
- ✅ Auto-register vào `app.module.ts`
- ✅ Consistent structure theo NestJS conventions

**Cấu trúc cuối cùng:**

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts
├── config/              # Configuration files
├── common/              # Shared resources
│   ├── dto/            # Data Transfer Objects
│   ├── filters/        # Exception filters
│   ├── interceptors/   # Interceptors
│   └── pipes/          # Pipes
├── modules/            # Feature modules
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── orders/
│   └── carts/
└── migrations/         # Database migrations
```

---

### Step 6: Setup .env.example và Git

```bash
# Tạo .env.example (template cho team, không commit .env thật)
echo "# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=ecommerce_db

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=1d

# App
PORT=3000
NODE_ENV=development" > .env.example

# Copy để tạo .env thật (sẽ customize ở Task 02)
cp .env.example .env

# Verify .gitignore đã có .env (NestJS CLI tự tạo)
git status

# Initial commit
git add .
git commit -m "chore: initial project setup with dependencies and env template"

# (Optional) Link to remote repository
# git remote add origin <your-repo-url>
# git push -u origin main
```

---

### Step 7: Verification - Test Project

```bash
# Check TypeScript compilation
npm run build
# Should complete without errors

# Start development server
npm run start:dev

# Expected output:
# [Nest] LOG [NestFactory] Starting Nest application...
# [Nest] LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] LOG [InstanceLoader] AuthModule dependencies initialized
# [Nest] LOG [InstanceLoader] UsersModule dependencies initialized
# [Nest] LOG Application is running on: http://localhost:3000
```

**Test trong browser:**

- Mở: <http://localhost:3000>
- Should see: "Hello World!"

**Test với curl:**

```bash
curl http://localhost:3000
# Output: Hello World!
```

**Verify ESLint:**

```bash
npm run lint
# Should run without errors
```

✅ **Nếu thấy "Hello World!" + build success = Setup hoàn tất!**

---

## ✅ Kết Quả Mong Đợi

- ✅ Project NestJS 11.x với cấu trúc thư mục chuẩn
- ✅ Tất cả dependencies pinned đã được cài đặt
- ✅ ESLint + Prettier configured
- ✅ App chạy được trên <http://localhost:3000>
- ✅ Git repository với .env.example
- ✅ TypeScript strict mode compilation success
- ✅ `npm run build` và `npm run lint` không có errors

---

## � Common Issues & Solutions

### Issue 1: Nest CLI version mismatch hoặc không tìm thấy

```bash
# Nếu dùng npx nhưng gặp lỗi
npx clear-npx-cache  # Clear cache
npx @nestjs/cli@latest --version

# Nếu global install bị outdated
npm uninstall -g @nestjs/cli
npm install -g @nestjs/cli@latest
```

### Issue 2: "Port 3000 is already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Or change port in main.ts
await app.listen(3001);
```

### Issue 3: "Permission denied" khi install global

```bash
# Linux/Mac: Use sudo
sudo npm i -g @nestjs/cli

# Windows: Run terminal as Administrator

# BEST: Dùng npx thay vì global install
npx @nestjs/cli@latest new my-app
```

### Issue 4: "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue 5: Node version không tương thích

```bash
# Check current version
node --version

# Install nvm (Node Version Manager)
# Windows: https://github.com/coreybutler/nvm-windows
# Linux/Mac: https://github.com/nvm-sh/nvm

# Install and use Node 20 LTS
nvm install 20
nvm use 20
```

### Issue 6: bcrypt native build errors (nếu dùng bcrypt thay bcryptjs)

```bash
# Windows: Install build tools
npm install --global windows-build-tools

# RECOMMENDED: Dùng bcryptjs thay bcrypt (pure JS, no native deps)
npm uninstall bcrypt
npm install bcryptjs@2.4.3
```

### Issue 7: ESLint/Prettier conflicts

```bash
# Ensure prettier runs last
npm install -D eslint-config-prettier
# Update .eslintrc.js extends: ['prettier'] phải ở cuối
```

---

## 📝 Implementation Checklist

### Pre-requisites

- [ ] Node.js v20+ or v22+ LTS installed and verified
- [ ] npm v9+ installed
- [ ] Git installed and configured
- [ ] VS Code (or preferred editor) với ESLint + Prettier extensions
- [ ] No other app using port 3000

### Implementation Steps

- [ ] Step 1: Verify npx access to @nestjs/cli
- [ ] Step 2: Create new project with `npx nest new --strict`
- [ ] Step 3: Install core dependencies với pinned versions
- [ ] Step 4: Install dev dependencies + ESLint/Prettier
- [ ] Step 5: Generate modules với `nest g module`
- [ ] Step 6: Create .env.example + Git commit
- [ ] Step 7: Verify build + dev server

### Verification

- [ ] `npm run build` completes successfully
- [ ] `npm run lint` passes without errors
- [ ] `npm run start:dev` runs without errors
- [ ] <http://localhost:3000> returns "Hello World!"
- [ ] All pinned dependencies in package.json
- [ ] .env.example exists, .env in .gitignore
- [ ] Git repository với initial commit

### Post-completion

- [ ] Update task status to ✅ Done
- [ ] Take screenshot of running app (optional)
- [ ] Document any customizations made
- [ ] Push initial commit to remote (if using Git remote)
- [ ] Proceed to **Task 02: Setup Environment & Configuration**

---

## ⏱️ Time Tracking

**Estimated Time:** 1.5-2 hours

- NestJS CLI setup (npx): 5 min
- Project creation với strict mode: 10 min
- Dependencies installation (pinned versions): 20-25 min
- ESLint/Prettier setup: 10 min
- Folder structure với CLI: 10 min
- .env.example + Git setup: 10 min
- Build + verification: 10-15 min
- Troubleshooting buffer: 15-20 min

**Actual Time:** **_ hours _** minutes

**Notes/Issues Encountered:**

```
(Ghi chú vấn đề gặp phải và cách giải quyết)
```

---

## 🔗 Related Tasks

**Dependencies:**

- None (This is the first task)

**Next Task:**

- ➡️ **Task 02**: Setup Environment & Configuration
  - Tạo `.env` file
  - Configure environment variables
  - Setup ConfigModule

**Related Documentation:**

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS CLI](https://docs.nestjs.com/cli/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 💡 Tips & Best Practices

1. **Ưu tiên npx**: Dùng `npx @nestjs/cli@latest` thay vì global install để tránh version conflicts
2. **Pin Dependencies**: Dùng exact versions (2.4.3) thay vì ranges (^2.4.3) cho stability
3. **bcryptjs > bcrypt**: Dùng bcryptjs để tránh native build issues trên Windows/Mac
4. **Nest CLI Generators**: Dùng `nest g` commands thay vì tạo files thủ công
5. **Version Control**: Commit .env.example, KHÔNG commit .env
6. **Code Quality**: Setup ESLint + Prettier ngay từ task đầu tiên
7. **Node LTS**: Dùng Node 20 hoặc 22 LTS, tránh odd versions (19, 21)

---

## 📸 Expected Results Screenshot

```
Terminal Output:
┌──────────────────────────────────────────────┐
│ [Nest] LOG Starting Nest application...     │
│ [Nest] LOG AppModule dependencies init      │
│ [Nest] LOG AuthModule dependencies init     │
│ [Nest] LOG UsersModule dependencies init    │
│ [Nest] Application successfully started     │
│ [Nest] Application running on:              │
│        http://localhost:3000                │
└──────────────────────────────────────────────┘

Browser (localhost:3000):
┌─────────────────────────────────────────┐
│ Hello World!                            │
└─────────────────────────────────────────┘

npm run build:
✔ Successfully compiled TypeScript
✔ Build completed in dist/
```

---

**Status:** ⬜ Not Started → 🔄 In Progress → ✅ Done

**Last Updated:** January 8, 2026
