# Hướng dẫn cấu hình Database MySQL

## 1. Cài đặt MySQL Server

### Windows:
1. Tải MySQL Installer từ: https://dev.mysql.com/downloads/installer/
2. Chọn "MySQL Server" và cài đặt
3. Thiết lập root password trong quá trình cài đặt

### Docker (Khuyến nghị):
```bash
docker run --name mysql-nestjs -e MYSQL_ROOT_PASSWORD=your_password -e MYSQL_DATABASE=nestjs_example -p 3306:3306 -d mysql:8.0
```

## 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc của dự án:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password_here
DB_DATABASE=nestjs_example
DB_SYNCHRONIZE=true
DB_LOGGING=true
```

## 3. Tạo Database

Kết nối vào MySQL và tạo database:

```sql
CREATE DATABASE nestjs_example;
```

## 4. Kiểm tra kết nối

Chạy lệnh sau để kiểm tra kết nối database:

```bash
npm run test:db
```

## 5. Chạy ứng dụng

```bash
npm run start:dev
```

## Lưu ý

- Đảm bảo MySQL server đang chạy trước khi test kết nối
- Thay đổi `DB_PASSWORD` thành password thực tế của bạn
- Nếu sử dụng Docker, đảm bảo container đang chạy
