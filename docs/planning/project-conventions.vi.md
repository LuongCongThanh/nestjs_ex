# 🛠️ Quy chuẩn Dự án & Tiêu chuẩn Tài liệu (Professional Edition)

Tài liệu này định nghĩa các tiêu chuẩn lập trình, mẫu tài liệu và kiến trúc hệ thống cho dự án Ecommerce API.

---

## 🏗️ 1. Kiến trúc Module & Dependency Injection (DI)

### Bố cục Module Chuẩn

Mọi tính năng phải được đóng gói tại `src/modules/[module-name]/`.

```text
src/modules/[module-name]/
├── controllers/          # Xử lý request HTTP
├── services/             # Logic nghiệp vụ (Business Logic)
├── dto/                  # Validation (Class-Validator)
├── interfaces/           # Type nội bộ
├── guards/               # Access Control
├── decorators/           # Custom Decorators
├── [module-name].module.ts
└── [module-name].service.spec.ts
```

### Quy tắc Dependency Injection

1.  **Circular Dependency**: Hạn chế tối đa sử dụng `forwardRef()`. Nếu hai module phụ thuộc lẫn nhau, hãy tách logic dùng chung ra một `CommonModule` hoặc `SharedModule`.
2.  **Explicit Exports**: Chỉ export các **Service** cần thiết, không bao giờ export toàn bộ Module trừ khi đó là Global Module.
3.  **Scopes**: Mặc định sử dụng `DEFAULT` scope (Singleton). Chỉ dùng `REQUEST` scope khi thực sự cần thiết vì lý do hiệu năng.

---

## 📐 2. Quy ước Đặt tên & Cấu trúc Dữ liệu

| Mục                   | Quy ước              | Ví dụ                                      |
| :-------------------- | :------------------- | :----------------------------------------- |
| **Classes**           | PascalCase           | `AuthService`, `UserController`            |
| **Interfaces**        | PascalCase           | `JwtPayload`, `UserWithRelations`          |
| **Files**             | kebab-case           | `auth.service.ts`, `get-user.decorator.ts` |
| **Variables/Methods** | camelCase            | `getUserById`, `updatedAt`                 |
| **Constants**         | SCREAMING_SNAKE_CASE | `MAX_RETRY_ATTEMPTS`                       |

---

## 🔒 3. An toàn Kiểu dữ liệu & Bảo mật

1.  **Strict Mode**: Bắt buộc `strict: true`. Không sử dụng `any` hoặc `unknown`. Phải khai báo type rõ ràng (ví dụ dùng `interface`, `Pick<T>`, hoặc cụ thể hóa DTO).
2.  **DTO Validation**:
    - Bắt buộc mọi API input phải có DTO.
    - Global Pipe phải bật `whitelist: true` và `forbidNonWhitelisted: true`.
3.  **Sensitive Data**: Sử dụng `class-transformer` (`@Exclude()`) hoặc Interceptor để xóa bỏ các trường nhạy cảm (`password`, `salt`) trước khi trả về cho client.
4.  **Enums**: Ưu tiên sử dụng `enum` cho các giá trị hằng số cố định (Role, Status).

---

## 📝 4. Tài liệu Code (JSDoc) & API

### JSDoc Standards

- **Classes**: Mô tả trách nhiệm của class.
- **Methods**: Phải có `@param`, `@returns` và `@throws`. Giải thích **TẠI SAO** (Why) thay vì **CÁI GÌ** (What).

### Swagger (OpenAPI)

- Tất cả endpoint phải có `@ApiTags`, `@ApiOperation`, và `@ApiResponse`.
- DTO phải dùng `@ApiProperty` để mô tả ý nghĩa và ví dụ dữ liệu.

---

## ⚠️ 5. Chiến lược Xử lý Lỗi (Error Handling)

1.  **Custom Exceptions**: Không trả về chuỗi text thuần túy. Luôn sử dụng `HttpException` hoặc các class kế thừa (`NotFoundException`, `BadRequestException`).
2.  **Global Filters**: Mọi lỗi không mong đợi phải được bắt tại Global Exception Filter để format response chuẩn: `{ statusCode, message, timestamp, path }`.

---

## ⚙️ 6. Quản lý Môi trường (Environment Management)

1.  **ConfigService**: Tuyệt đối không sử dụng `process.env` trực tiếp trong code. Luôn truy cập thông qua `ConfigService`.
2.  **Environment Validation**: Mọi biến môi trường phải được xác thực (dùng Joi hoặc Zod) trong `ConfigModule` để đảm bảo ứng dụng không khởi động nếu thiếu cấu hình quan trọng.
3.  **`.env.example`**: Luôn cập nhật file này khi thêm biến môi trường mới.

---

## 📊 7. Logging & Giám sát (Observability)

1.  **Correlation ID**: Mọi request phải đính kèm một `request-id` duy nhất trong log để dễ dàng truy vết (sử dụng middleware hoặc interceptor).
2.  **Log Levels**:
    - `Error`: Lỗi nghiêm trọng cần can thiệp ngay.
    - `Warn`: Các tình huống bất thường nhưng ứng dụng vẫn chạy được.
    - `Info`: Luồng xử lý chính của hệ thống.
3.  **No `console.log`**: Chỉ sử dụng `Logger` từ `@nestjs/common`.

---

## 💎 8. Tối ưu hóa Database (Prisma Best Practices)

1.  **Selective Fetching**: Luôn sử dụng `select` để lấy các trường cần thiết. Tránh lấy toàn bộ object nếu không dùng tới.
2.  **Transactions**: Bắt buộc sử dụng Prisma Transactions (`$transaction`) cho các thao tác liên quan đến Order, Inventory hoặc các chuỗi thay đổi dữ liệu phụ thuộc lẫn nhau.
3.  **Indexes**: Kiểm tra và đảm bảo các trường hay dùng để lọc (Filter/Sort) đã được đánh Index trong schema.

---

## 🧪 9. Tiêu chuẩn Kiểm thử (Testing)

- **Unit Tests**: Tập trung vào Service logic. Sử dụng `@golevelup/ts-jest` để mock dependencies.
- **E2E Tests**: Tập trung vào các luồng nghiệp vụ quan trọng (Checkout, Auth flow).
- **Mẫu**: Arrange-Act-Assert.

---

## 🚀 10. Quy trình Git & Merge

- **Commits**: Tuân thủ [Conventional Commits](https://www.conventionalcommits.org/).
- **Quality Gate**: PR chỉ được merge khi vượt qua `npm run lint` và `npm run build`.

---

**Triết lý**: Code được đọc nhiều hơn khi được viết. Hãy viết code cho người sẽ bảo trì nó sau bạn.
