import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

/**
 * ================================
 * RESET PASSWORD DTO - Đặt lại mật khẩu mới
 * ================================
 *
 * DTO này dùng sau khi user nhận email và click vào reset link
 *
 * FLOW RESET PASSWORD:
 * 1. User nhận email chứa reset link
 * 2. Click link: https://app.com/reset-password?token=xyz123
 * 3. Frontend hiển thị form nhập password mới
 * 4. User nhập password mới
 * 5. Frontend gửi token + newPassword đến API
 * 6. Server verify token:
 *    a. Token còn hạn không? (expiresAt > now)
 *    b. Token chưa dùng chưa? (usedAt = null)
 *    c. Token có trong database không?
 * 7. Nếu hợp lệ:
 *    - Hash newPassword
 *    - Update user.password
 *    - Đánh dấu token đã sử dụng (usedAt = now)
 *    - Revoke all user sessions (optional)
 *    - Gửi email xác nhận password đã đổi
 * 8. Nếu không hợp lệ:
 *    → throw BadRequestException: "Invalid or expired token"
 *
 * @example
 * POST /auth/reset-password
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "newPassword": "NewPassword@123"
 * }
 */
export class ResetPasswordDto {
  /**
   * TOKEN - Mã xác thực reset password từ email
   *
   * Validators:
   * - @IsString(): Phải là chuỗi
   * - @IsNotEmpty(): Không được trống
   *
   * TOKEN TYPES:
   *
   * 1. JWT Token:
   *    - Payload: { userId, type: 'password-reset', exp }
   *    - Verify signature với SECRET_KEY
   *    - Kiểm tra exp (expiration time)
   *
   * 2. Random Token:
   *    - crypto.randomBytes(32).toString('hex')
   *    - Lưu hash vào database với expiry time
   *    - Verify bằng cách query database
   *
   * VALIDATION PROCESS:
   * ```typescript
   * // 1. Query database
   * const resetToken = await resetTokenRepo.findOne({
   *   where: { token: hash(token), used: false },
   *   relations: ['user']
   * });
   *
   * // 2. Kiểm tra tồn tại
   * if (!resetToken) {
   *   throw new BadRequestException('Invalid token');
   * }
   *
   * // 3. Kiểm tra hết hạn
   * if (resetToken.expiresAt < new Date()) {
   *   throw new BadRequestException('Token expired');
   * }
   *
   * // 4. Kiểm tra đã dùng
   * if (resetToken.used) {
   *   throw new BadRequestException('Token already used');
   * }
   * ```
   *
   * BẢO MẬT:
   * - Token chỉ dùng 1 lần (one-time use)
   * - Token hết hạn sau 15-30 phút
   * - Token phải được hash trước khi lưu database
   * - Sau khi reset thành công → xoá token khỏi database
   */
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token from email',
  })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  /**
   * NEW PASSWORD - Mật khẩu mới
   *
   * Validators:
   * - @IsStrongPassword(): Validate mật khẩu mạnh
   *   + Ít nhất 1 chữ hoa (A-Z)
   *   + Ít nhất 1 chữ thường (a-z)
   *   + Ít nhất 1 số hoặc ký tự đặc biệt
   * - @MinLength(8): Tối thiểu 8 ký tự
   * - @IsNotEmpty(): Không được trống
   *
   * PROCESS SAU KHI VALIDATE TOKEN THÀNH CÔNG:
   * ```typescript
   * // 1. Hash password mới
   * const hashedPassword = await bcrypt.hash(newPassword, 10);
   *
   * // 2. Update user password
   * await userRepo.update(
   *   { id: resetToken.userId },
   *   { password: hashedPassword }
   * );
   *
   * // 3. Đánh dấu token đã sử dụng
   * await resetTokenRepo.update(
   *   { id: resetToken.id },
   *   { used: true, usedAt: new Date() }
   * );
   *
   * // 4. Tùy chọn: Revoke all sessions
   * await tokenBlacklistService.revokeUserTokens(
   *   resetToken.userId,
   *   'password_reset'
   * );
   *
   * // 5. Gửi email xác nhận
   * await emailService.sendPasswordChangedEmail(user.email);
   * ```
   *
   * BEST PRACTICE:
   * - Sau khi reset thành công → Force user login lại
   * - Gửi email thông báo "Password changed successfully"
   * - Log audit: "Password reset at 2026-01-12 10:30 via token"
   * - Nếu user không tự reset → Có thể bị hack, cần thông báo ngay
   */
  @ApiProperty({
    example: 'NewPassword@123',
    description: 'New password (min 8 characters, must contain uppercase, lowercase, and number)',
    minLength: 8,
  })
  @IsStrongPassword()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  newPassword: string;
}
