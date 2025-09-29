# Hướng dẫn sử dụng NestJS Example API

## Tổng quan
Project này là một ví dụ về NestJS API với Swagger documentation, bao gồm module quản lý người dùng (Users) với các chức năng CRUD cơ bản.

## Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy ứng dụng
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### 3. Truy cập API
- **API Base URL**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api

## API Endpoints

### Users API

#### 1. Tạo người dùng mới
```http
POST /users
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "password": "password123",
  "phone": "0123456789"
}
```

#### 2. Lấy danh sách tất cả người dùng
```http
GET /users
```

#### 3. Lấy thông tin người dùng theo ID
```http
GET /users/{id}
```

#### 4. Cập nhật thông tin người dùng
```http
PATCH /users/{id}
Content-Type: application/json

{
  "fullName": "Nguyễn Văn B",
  "phone": "0987654321"
}
```

#### 5. Xóa người dùng
```http
DELETE /users/{id}
```

## Cấu trúc Project

```
src/
├── users/                    # Module quản lý người dùng
│   ├── dto/                 # Data Transfer Objects
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── entities/            # Entity definitions
│   │   └── user.entity.ts
│   ├── users.controller.ts  # Controller xử lý HTTP requests
│   ├── users.service.ts     # Service chứa business logic
│   └── users.module.ts      # Module configuration
├── app.module.ts            # Root module
├── main.ts                  # Application entry point
└── ...
```

## Tính năng

### 1. Validation
- Sử dụng `class-validator` để validate dữ liệu đầu vào
- Email validation
- Password minimum length validation
- Required field validation

### 2. Swagger Documentation
- Tự động generate API documentation
- Interactive API testing interface
- Detailed request/response schemas
- Vietnamese descriptions

### 3. Error Handling
- Custom error messages in Vietnamese
- HTTP status codes phù hợp
- Validation error responses

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Scripts có sẵn

- `npm run start` - Chạy production
- `npm run start:dev` - Chạy development với watch mode
- `npm run start:debug` - Chạy debug mode
- `npm run build` - Build project
- `npm run test` - Chạy unit tests
- `npm run test:e2e` - Chạy e2e tests
- `npm run test:cov` - Chạy tests với coverage
- `npm run lint` - Chạy ESLint
- `npm run format` - Format code với Prettier

## Mở rộng

Để thêm module mới:

1. Tạo thư mục module trong `src/`
2. Tạo controller, service, DTO, entity
3. Import module vào `app.module.ts`
4. Thêm Swagger decorators cho documentation

## Lưu ý

- Dữ liệu hiện tại được lưu trong memory (không persistent)
- Để sử dụng database thực, cần tích hợp TypeORM hoặc Prisma
- Cần thêm authentication/authorization cho production
