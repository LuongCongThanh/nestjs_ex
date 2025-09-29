# Cấu hình Database PostgreSQL

## 1. Tạo file .env

Tạo file `.env` trong thư mục gốc của dự án với nội dung:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/nestjs_db?schema=public"
```

**Lưu ý:** Thay `password` bằng mật khẩu PostgreSQL của bạn.

## 2. Các ví dụ cấu hình khác nhau

### Development (Local)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/nestjs_dev?schema=public"
```

### Production
```env
DATABASE_URL="postgresql://username:password@your-host:5432/nestjs_prod?schema=public"
```

### Docker PostgreSQL
```env
DATABASE_URL="postgresql://postgres:password@postgres:5432/nestjs_db?schema=public"
```

## 3. Cài đặt PostgreSQL

### Windows
1. Tải PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Cài đặt với mật khẩu cho user `postgres`
3. Tạo database mới:
   ```bash
   createdb nestjs_db
   ```
   Hoặc sử dụng psql:
   ```sql
   psql -U postgres
   CREATE DATABASE nestjs_db;
   \q
   ```

### Docker
```bash
docker run --name postgres-nestjs -e POSTGRES_PASSWORD=password -e POSTGRES_DB=nestjs_db -p 5432:5432 -d postgres:15
```

## 4. Chạy Prisma Migration

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Hoặc tạo migration
npx prisma migrate dev --name init
```

## 5. Test kết nối

```bash
npm run test:db
```
