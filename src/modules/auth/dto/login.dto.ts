import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * ================================
 * LOGIN DTO - Đăng nhập người dùng
 * ================================
 *
 * DTO này dùng để validate dữ liệu khi user đăng nhập
 *
 * FLOW ĐĂNG NHẬP:
 * 1. Client gửi email + password
 * 2. NestJS validate với LoginDto
 * 3. Controller nhận data đã validate
 * 4. AuthService tìm user theo email
 * 5. So sánh password với bcrypt.compare()
 * 6. Nếu đúng → Generate JWT token
 * 7. Trả về token + user info
 *
 * LƯU Ý BẢO MẬT:
 * - Password gửi lên là plain text (qua HTTPS)
 * - Server so sánh với hash trong database
 * - KHÔNG BAO GIỜ trả password về client
 * - Nếu sai → throw UnauthorizedException với message chung
 *   "Invalid email or password" (không tiết lộ email có tồn tại hay không)
 *
 * @example
 * POST /auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "Password@123"
 * }
 *
 * Response nếu thành công:
 * {
 *   "statusCode": 200,
 *   "success": true,
 *   "message": "User logged in successfully",
 *   "data": {
 *     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": { id, email, firstName, lastName, role, ... }
 *   }
 * }
 */
export class LoginDto {
  /**
   * EMAIL - Địa chỉ email để đăng nhập
   *
   * Validators:
   * - @IsEmail(): Validate format email (phải có @ và domain hợp lệ)
   * - @IsNotEmpty(): Không được để trống
   *
   * PROCESS:
   * 1. Validate format email
   * 2. Tìm user trong database: WHERE email = ?
   * 3. Nếu không tìm thấy → "Invalid email or password"
   * 4. Nếu tìm thấy → Tiếp tục verify password
   *
   * LƯU Ý:
   * - Email case-insensitive: "USER@TEST.COM" = "user@test.com"
   * - Không tiết lộ email có tồn tại hay không (security)
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * PASSWORD - Mật khẩu để đăng nhập
   *
   * Validators:
   * - @IsString(): Phải là chuỗi text
   * - @IsNotEmpty(): Không được để trống
   *
   * LƯU Ý: Không validate strong password ở đây
   * → Chỉ validate ở RegisterDto (khi tạo mới)
   * → Login chỉ cần verify với hash có sẵn
   *
   * PROCESS VERIFY PASSWORD:
   * 1. Lấy password hash từ database
   * 2. So sánh: bcrypt.compare(plainPassword, hashedPassword)
   *    VÍ DỤ:
   *    - plainPassword: "Password@123"
   *    - hashedPassword: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
   *    - Result: true/false
   * 3. Nếu false → "Invalid email or password"
   * 4. Nếu true → Check isActive → Generate token
   *
   * BẢO MẬT:
   * - Password được gửi qua HTTPS (encrypted in transit)
   * - Server chỉ so sánh, không lưu plain password
   * - Luôn dùng message chung khi fail (không leak thông tin)
   */
  @ApiProperty({
    example: 'Password@123',
    description: 'User password',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
