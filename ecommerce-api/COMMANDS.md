# Lệnh thường dùng cho Ecommerce API

Tài liệu này tập trung liệt kê các câu lệnh quan trọng trong repo và giải thích nhanh tác dụng của từng lệnh.

## 1) NPM scripts (package.json)

> Chạy từ thư mục `ecommerce-api/`.

- `npm run build` - Build ứng dụng NestJS ra thư mục `dist/`.
- `npm run format` - Format code bằng Prettier trong `src/` và `test/`.
- `npm run start` - Chạy app theo chế độ mặc định (NestJS).
- `npm run start:dev` - Chạy dev mode có watch (tự reload khi đổi code).
- `npm run start:debug` - Chạy dev mode kèm debug (Node inspector).
- `npm run start:prod` - Chạy bản build đã có trong `dist/`.
- `npm run lint` - Lint code bằng ESLint và tự fix lỗi có thể.

### Test

- `npm run test` - Chạy unit tests với Jest.
- `npm run test:watch` - Chạy test ở chế độ watch.
- `npm run test:cov` - Chạy test và xuất báo cáo coverage.
- `npm run test:debug` - Chạy test với debug (Node inspector).
- `npm run test:e2e` - Chạy end-to-end tests.

### TypeORM / Migration

- `npm run typeorm -- <args>` - Gọi CLI TypeORM với args tùy chọn.
- `npm run migration:create` - Tạo file migration rỗng trong `src/migrations/`.
- `npm run migration:generate` - Tự generate migration dựa trên thay đổi entity.
- `npm run migration:run` - Chạy các migration chưa chạy.
- `npm run migration:revert` - Rollback migration cuối cùng.
- `npm run migration:show` - Xem trạng thái migration.

### Seeder

- `npm run seed` - Seed dữ liệu mẫu (admin, categories, products, ...).

## 2) Docker (PostgreSQL + pgAdmin)

> Các lệnh này được dùng trong `ecommerce-api/`.

- `docker-compose up -d` - Khởi động các container ở chế độ nền.
- `docker ps` - Kiểm tra container đang chạy.
- `docker-compose down` - Dừng và remove container.
- `docker-compose logs -f postgres` - Xem log realtime của Postgres.

### Truy cập DB

- `docker exec -it ecommerce-api-postgres-1 psql -U postgres -d ecommerce_db` - Vào CLI psql trong container.
- `docker exec -t ecommerce-api-postgres-1 pg_dump -U postgres ecommerce_db > backup.sql` - Backup database ra file.
- `docker exec -i ecommerce-api-postgres-1 psql -U postgres -d ecommerce_db < backup.sql` - Restore database từ file backup.

## 3) Database workflow (tóm tắt)

- `docker-compose up -d` - Mở DB.
- `npm run migration:run` - Tạo bảng từ migration.
- `npm run seed` - Seed dữ liệu mẫu.
- `npm run start:dev` - Chạy app để test.
