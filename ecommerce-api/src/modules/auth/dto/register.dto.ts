import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

/**
 * ================================
 * REGISTER DTO - Đăng ký người dùng mới
 * ================================
 *
 * DTO (Data Transfer Object) này dùng để:
 * 1. Validate dữ liệu đầu vào khi user đăng ký
 * 2. Document API với Swagger (@ApiProperty)
 * 3. Transform và sanitize dữ liệu
 *
 * FLOW SỬ DỤNG:
 * Client gửi request → NestJS ValidationPipe → Validate DTO → Pass vào Controller
 *
 * NẾU VALIDATION FAILED:
 * → Tự động throw BadRequestException
 * → Response: 400 Bad Request với array error messages
 *
 * @example
 * POST /auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "Password@123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "phone": "0987654321"
 * }
 */
export class RegisterDto {
  /**
   * EMAIL - Địa chỉ email của người dùng
   *
   * Validators:
   * - @IsEmail(): Kiểm tra format email hợp lệ (có @ và domain)
   * - @IsNotEmpty(): Không được để trống
   *
   * @ApiProperty: Dùng cho Swagger documentation
   * - example: Giá trị mẫu hiển thị trong Swagger UI
   * - description: Mô tả field
   *
   * Error messages nếu invalid:
   * - "Please provide a valid email address" (nếu không đúng format)
   * - "Email is required" (nếu bỏ trống)
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * PASSWORD - Mật khẩu của người dùng
   *
   * Validators:
   * - @IsStrongPassword(): Custom validator kiểm tra mật khẩu mạnh
   *   + Phải có ít nhất 1 chữ hoa (A-Z)
   *   + Phải có ít nhất 1 chữ thường (a-z)
   *   + Phải có ít nhất 1 số (0-9) hoặc ký tự đặc biệt (@#$%...)
   * - @MinLength(8): Tối thiểu 8 ký tự
   * - @IsNotEmpty(): Không được để trống
   *
   * LƯU Ý BẢO MẬT:
   * - Password này sẽ được hash bằng bcrypt trước khi lưu database
   * - KHÔNG BAO GIỜ lưu plain password vào database
   * - bcrypt.hash(password, 10) → "$2a$10$..."
   *
   * @example Valid passwords:
   * - "Password@123"
   * - "MySecure#Pass1"
   * - "Test1234!@#"
   *
   * @example Invalid passwords:
   * - "password" (không có chữ hoa, số)
   * - "PASSWORD" (không có chữ thường, số)
   * - "Pass123" (quá ngắn, < 8 ký tự)
   */
  @ApiProperty({
    example: 'Password@123',
    description:
      'Password must be at least 8 characters and contain uppercase, lowercase, and number or special character',
    minLength: 8,
  })
  @IsStrongPassword()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  /**
   * FIRST NAME - Tên của người dùng
   *
   * Validators:
   * - @IsString(): Phải là chuỗi text
   * - @IsNotEmpty(): Không được để trống
   *
   * Lưu vào database dạng plain text
   * Dùng để hiển thị tên user trong UI
   */
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  /**
   * LAST NAME - Họ của người dùng
   *
   * Validators:
   * - @IsString(): Phải là chuỗi text
   * - @IsNotEmpty(): Không được để trống
   *
   * Kết hợp với firstName để hiển thị tên đầy đủ:
   * fullName = `${firstName} ${lastName}` → "John Doe"
   */
  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  /**
   * PHONE - Số điện thoại của người dùng (OPTIONAL)
   *
   * Validators:
   * - @IsString(): Phải là chuỗi text
   * - @IsOptional(): Field này không bắt buộc
   *
   * phone?: string → Dấu ? có nghĩa là optional (có thể undefined)
   *
   * Client có thể:
   * 1. Bỏ qua field này → phone = undefined
   * 2. Gửi phone = null → phone = null
   * 3. Gửi phone = "0987654321" → phone = "0987654321"
   *
   * LƯU Ý: Không validate format số điện thoại
   * → Có thể thêm custom validator nếu cần validate format cụ thể
   */
  @ApiProperty({
    example: '0987654321',
    description: 'User phone number (optional)',
    required: false,
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phone?: string;
}
