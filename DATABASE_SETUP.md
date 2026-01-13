# Database Setup Guide

Hướng dẫn tạo và quản lý database cho E-commerce API.

## 📋 Tổng quan

Project này sử dụng:

- **PostgreSQL 16** (via Docker)
- **TypeORM** (ORM framework)
- **9 core entities** (User, Category, Product, Cart, CartItem, Order, OrderItem, Address, Payment)

## 🚀 Quick Start

### 1. Start PostgreSQL Database

```bash
# Start Docker containers
docker-compose up -d

# Verify containers are running
docker ps
```

Các service:

- **PostgreSQL**: `localhost:5432`
- **pgAdmin**: `http://localhost:5050`
  - Email: `admin@admin.com`
  - Password: `admin`

### 2. Run Database Migration

```bash
# Run migration to create tables
npm run migration:run

# Check migration status
npm run migration:show
```

### 3. Seed Initial Data

```bash
# Seed default data (admin, categories, products)
npm run seed
```

Sau khi seed, bạn có thể login với:

- **Admin**: `admin@example.com` / `Admin@123`
- **User**: `user@example.com` / `User@123`

## 📊 Database Schema

### Core Tables

#### 1. **users** - Quản lý người dùng

```
- id (UUID)
- email (unique)
- password (hashed)
- firstName, lastName
- phone
- role (user, admin, staff)
- isActive, emailVerified
- createdAt, updatedAt
```

#### 2. **categories** - Danh mục sản phẩm (hỗ trợ cây phân cấp)

```
- id (serial)
- name, slug (unique)
- description, image
- parentId (self-reference)
- isActive
- createdAt, updatedAt
```

#### 3. **products** - Sản phẩm

```
- id (serial)
- name, slug (unique), sku (unique)
- description, price, comparePrice
- stock, images (JSON)
- categoryId
- weight, dimensions (JSON)
- tags (JSON), seo (JSON)
- isActive, isFeatured
- deletedAt (soft delete)
- createdAt, updatedAt
```

#### 4. **addresses** - Địa chỉ giao hàng

```
- id (serial)
- userId
- label, fullName, phone
- address, ward, district, city, country
- postalCode, isDefault, type
- createdAt, updatedAt
```

#### 5. **carts** - Giỏ hàng

```
- id (serial)
- userId
- isActive
- createdAt, updatedAt
```

#### 6. **cart_items** - Chi tiết giỏ hàng

```
- id (serial)
- cartId, productId
- quantity, price (snapshot)
- createdAt, updatedAt
```

#### 7. **orders** - Đơn hàng

```
- id (serial)
- orderNumber (unique)
- userId
- subtotal, tax, shippingFee, total
- status (pending, confirmed, processing, shipped, delivered, cancelled, refunded)
- paymentStatus (pending, paid, failed, refunded)
- shippingAddressSnapshot (JSON)
- notes, adminNote, cancelReason
- estimatedDeliveryDate
- createdAt, updatedAt
```

#### 8. **order_items** - Chi tiết đơn hàng

```
- id (serial)
- orderId, productId
- productName, price (snapshot)
- quantity, total
```

#### 9. **payments** - Thanh toán

```
- id (serial)
- orderId
- method (cod, bank_transfer, momo, vnpay, zalopay, credit_card, paypal)
- amount, currency
- status (pending, processing, paid, failed, cancelled, refunded)
- transactionId, provider
- providerResponse (JSON)
- paymentProof, ipAddress
- paidAt, createdAt, updatedAt
```

## 🔧 Migration Commands

```bash
# Generate new migration from entity changes
npm run migration:generate -- src/migrations/MigrationName

# Create empty migration file
npm run migration:create -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## 🌱 Seeder Details

Script `npm run seed` sẽ tạo:

### Users

- 1 Admin user: `admin@example.com` / `Admin@123`
- 1 Test user: `user@example.com` / `User@123`

### Categories (6 parent + 5 sub-categories)

- Điện thoại & Phụ kiện
  - iPhone
  - Samsung
  - Tai nghe
- Laptop & Máy tính
  - Laptop Gaming
  - Laptop Văn phòng
- Thời trang Nam
- Thời trang Nữ
- Đồ gia dụng
- Sách & Văn phòng phẩm

### Products (6 sample products)

- iPhone 15 Pro Max 256GB
- Samsung Galaxy S24 Ultra 512GB
- Laptop Dell XPS 13 9340
- MacBook Air M3 15 inch 2024
- Sony WH-1000XM5 Wireless
- Áo thun nam basic cotton

## 🔍 Key Design Decisions

### 1. **UUID for Users**

- Tăng bảo mật (không đoán được ID)
- Tốt cho distributed systems

### 2. **Price Snapshots**

- `cart_items.price`: Lưu giá tại thời điểm thêm vào giỏ
- `order_items.price`: Lưu giá tại thời điểm đặt hàng
- **Lý do**: Tránh thay đổi giá ảnh hưởng đơn hàng cũ

### 3. **Address Snapshot in Orders**

- `orders.shippingAddressSnapshot` (JSON)
- **Lý do**: Địa chỉ có thể thay đổi, cần lưu vĩnh viễn cho đơn hàng

### 4. **Soft Delete for Products**

- Dùng `deletedAt` thay vì xóa thật
- **Lý do**: Giữ lịch sử đơn hàng, thống kê

### 5. **Category Tree Structure**

- Self-referencing với `parentId`
- Hỗ trợ danh mục đa cấp

### 6. **Indexes**

- Tất cả foreign keys có index
- Các trường thường query: `email`, `slug`, `isActive`, `status`
- Composite indexes: `(categoryId, isActive)`, `(userId, isActive)`

## 🔒 Security Best Practices

1. **Password Hashing**: Dùng `bcryptjs` với salt rounds = 10
2. **UUID for Users**: Tránh enumeration attacks
3. **Soft Delete**: Không mất dữ liệu quan trọng
4. **Input Validation**: Sử dụng `class-validator` trong DTOs

## 📝 Environment Variables

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root123
DB_DATABASE=ecommerce_db
DB_SYNCHRONIZE=true  # Set to false in production!
DB_LOGGING=true      # Set to false in production
```

⚠️ **Important**:

- Set `DB_SYNCHRONIZE=false` in production
- Use migrations instead of auto-sync
- Enable connection pooling for better performance

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres

# Access PostgreSQL CLI
docker exec -it ecommerce-api-postgres-1 psql -U postgres -d ecommerce_db

# Backup database
docker exec -t ecommerce-api-postgres-1 pg_dump -U postgres ecommerce_db > backup.sql

# Restore database
docker exec -i ecommerce-api-postgres-1 psql -U postgres -d ecommerce_db < backup.sql
```

## 🎯 Next Steps

1. ✅ Database schema created
2. ✅ Migration generated
3. ✅ Seeder implemented
4. 🔄 Implement Auth module (JWT)
5. 🔄 Implement CRUD endpoints
6. 🔄 Add validation & error handling
7. 🔄 Write unit tests
8. 🔄 Add API documentation (Swagger)

## 📚 Related Documents

- [TASK-00005-Thiết-kế-Database-Schema.md](../../ecommerce-api-doc/tasks/TASK-00005-Thiết-kế-Database-Schema.md) - Chi tiết schema design
- [TASK-00011-Generate-Run-Migrations.md](../../ecommerce-api-doc/tasks/TASK-00011-Generate-Run-Migrations.md) - Migration strategy
- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)

## 🆘 Troubleshooting

### Problem: "docker: command not found"

**Solution**: Install Docker Desktop hoặc start Docker daemon

### Problem: "Port 5432 already in use"

**Solution**:

```bash
# Windows
netstat -ano | findstr :5432
taskkill /PID <PID> /F

# Hoặc thay đổi port trong docker-compose.yml
```

### Problem: "No changes in database schema were found"

**Solution**: Database đã được sync tự động (via `synchronize: true`). Migration chỉ cần khi deploy production.

### Problem: "Entity not found"

**Solution**: Kiểm tra TypeORM config có đúng `entities` path không.

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. Docker containers đang chạy: `docker ps`
2. Database connection: Xem logs ở `docker-compose logs postgres`
3. TypeORM config: Kiểm tra `src/config/typeorm.config.ts`
4. Entities imported đúng: Xem `src/entities/index.ts`
