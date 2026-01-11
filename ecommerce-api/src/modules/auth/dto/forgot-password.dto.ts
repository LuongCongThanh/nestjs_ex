import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * ================================
 * FORGOT PASSWORD DTO - Quên mật khẩu
 * ================================
 *
 * DTO này dùng khi user QUÊN password và muốn reset
 *
 * FLOW QUÊN MẬT KHẨU:
 * 1. User gửi email vào form "Forgot Password"
 * 2. Server tìm user theo email
 * 3. Nếu tìm thấy:
 *    a. Generate reset token (JWT hoặc random string)
 *    b. Lưu token vào database với expiry time (15-30 phút)
 *    c. Gửi email chứa reset link
 *    d. Link format: https://app.com/reset-password?token=xyz123
 * 4. Nếu KHÔNG tìm thấy:
 *    → Vẫn trả về "Email sent" (không tiết lộ email có tồn tại hay không)
 *
 * KHÁC BIỆT VỚI CHANGE PASSWORD:
 * - ForgotPassword: User KHÔNG đăng nhập, quên password
 * - ChangePassword: User ĐÃ đăng nhập, biết password cũ
 *
 * BẢO MẬT:
 * - Reset token phải có expiry time (15-30 phút)
 * - Token chỉ dùng 1 lần (one-time use)
 * - Không tiết lộ email có tồn tại trong hệ thống
 * - Rate limiting: Chỉ cho phép gửi 3-5 request/phút
 *
 * @example
 * POST /auth/forgot-password
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response:
 * {
 *   "statusCode": 200,
 *   "success": true,
 *   "message": "If the email exists, a password reset link has been sent",
 *   "data": {
 *     "email": "user@example.com"
 *   }
 * }
 */
export class ForgotPasswordDto {
  /**
   * EMAIL - Địa chỉ email để gửi link reset password
   *
   * Validators:
   * - @IsEmail(): Validate format email
   * - @IsNotEmpty(): Không được trống
   *
   * PROCESS:
   * 1. Tìm user trong database: WHERE email = ?
   * 2. Nếu tìm thấy:
   *    - Generate reset token
   *    - Token format: JWT hoặc crypto.randomBytes(32).toString('hex')
   *    - Save to database:
   *      {
   *        userId: user.id,
   *        token: hash(token),
   *        expiresAt: new Date(Date.now() + 30 * 60 * 1000)  // 30 phút
   *      }
   *    - Gửi email:
   *      Subject: "Reset Your Password"
   *      Body: "Click here to reset: https://app.com/reset?token=xyz"
   * 3. Nếu KHÔNG tìm thấy:
   *    - Vẫn trả về success (không leak thông tin)
   *    - Không gửi email
   *
   * EMAIL TEMPLATE:
   * ---
   * Hi {{firstName}},
   *
   * We received a request to reset your password.
   * Click the link below to reset:
   *
   * https://app.com/reset-password?token={{resetToken}}
   *
   * This link expires in 30 minutes.
   *
   * If you didn't request this, ignore this email.
   * ---
   *
   * BẢO MẬT:
   * - Không gửi token trong response API
   * - Chỉ gửi qua email
   * - Token phải được hash trước khi lưu database
   * - Implement rate limiting (max 5 requests/hour/email)
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send password reset link',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
