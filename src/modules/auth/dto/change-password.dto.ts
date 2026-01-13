import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

/**
 * ================================
 * CHANGE PASSWORD DTO - Đổi mật khẩu
 * ================================
 *
 * DTO này dùng cho endpoint đổi mật khẩu (khi user đã đăng nhập)
 *
 * FLOW ĐỔI MẬT KHẨU:
 * 1. User đã login (có JWT token)
 * 2. Gửi oldPassword + newPassword
 * 3. Server verify oldPassword với hash trong database
 * 4. Nếu đúng → Hash newPassword và update database
 * 5. Optional: Revoke tất cả tokens cũ (force re-login)
 * 6. Trả về token mới
 *
 * KHÁC BIỆT VỚI RESET PASSWORD:
 * - ChangePassword: User ĐÃ LOGIN, biết password cũ
 * - ResetPassword: User QUÊN password, cần email reset link
 *
 * @example
 * POST /auth/change-password
 * Authorization: Bearer <token>
 * {
 *   "oldPassword": "OldPassword@123",
 *   "newPassword": "NewPassword@456"
 * }
 */
export class ChangePasswordDto {
  /**
   * OLD PASSWORD - Mật khẩu hiện tại
   *
   * Validators:
   * - @IsString(): Phải là chuỗi
   * - @IsNotEmpty(): Không được trống
   *
   * MỤC ĐÍCH:
   * Xác minh user biết password hiện tại (security check)
   * → Ngăn chặn trường hợp:
   *   - Ai đó lấy được device của user và đổi password
   *   - Session hijacking
   *
   * PROCESS:
   * 1. Lấy user từ JWT token (request.user)
   * 2. Load password hash từ database
   * 3. Verify: bcrypt.compare(oldPassword, user.password)
   * 4. Nếu sai → throw UnauthorizedException
   * 5. Nếu đúng → Cho phép đổi password
   */
  @ApiProperty({
    example: 'OldPassword@123',
    description: 'Current password',
  })
  @IsString({ message: 'Old password must be a string' })
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword: string;

  /**
   * NEW PASSWORD - Mật khẩu mới
   *
   * Validators:
   * - @IsStrongPassword(): Validate mật khẩu mạnh
   *   + Ít nhất 1 chữ hoa
   *   + Ít nhất 1 chữ thường
   *   + Ít nhất 1 số hoặc ký tự đặc biệt
   * - @MinLength(8): Tối thiểu 8 ký tự
   * - @IsNotEmpty(): Không được trống
   *
   * BEST PRACTICE:
   * - Kiểm tra newPassword !== oldPassword (không đổi thành password cũ)
   * - Hash với bcrypt.hash(newPassword, 10)
   * - Update database: user.password = newHash
   * - Tùy chọn: Revoke all tokens, force re-login
   * - Gửi email thông báo đổi password thành công
   *
   * BẢO MẬT:
   * - Nếu đổi password → Nên revoke tất cả sessions cũ
   * - Generate token mới cho session hiện tại
   * - Log audit: "Password changed at 2026-01-12 10:30"
   */
  @ApiProperty({
    example: 'NewPassword@123',
    description:
      'New password (min 8 characters, must contain uppercase, lowercase, and number)',
    minLength: 8,
  })
  @IsStrongPassword()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}
