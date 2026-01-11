import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * ================================
 * RESEND OTP DTO - Gửi lại mã OTP
 * ================================
 *
 * DTO này dùng khi user chưa nhận được OTP hoặc OTP đã hết hạn
 *
 * OTP (One-Time Password) LÀ GÌ?
 * - Mã 6 số ngẫu nhiên: 123456
 * - Dùng để xác thực email/sđt
 * - Hết hạn sau 5-10 phút
 * - Chỉ dùng 1 lần
 *
 * FLOW RESEND OTP:
 * 1. User chưa nhận được OTP
 * 2. Click "Resend OTP"
 * 3. Gửi email đến API
 * 4. Server:
 *    a. Kiểm tra user tồn tại
 *    b. Kiểm tra rate limit (max 3 lần/5 phút)
 *    c. Vô hiệu hóa OTP cũ (nếu có)
 *    d. Generate OTP mới
 *    e. Lưu vào database với expiry time
 *    f. Gửi email/SMS chứa OTP
 * 5. Trả về thành công
 *
 * USE CASES:
 * - Xác thực email sau khi đăng ký
 * - Xác thực số điện thoại
 * - 2FA (Two-Factor Authentication)
 * - Xác nhận giao dịch quan trọng
 *
 * @example
 * POST /auth/resend-otp
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response:
 * {
 *   "statusCode": 200,
 *   "success": true,
 *   "message": "OTP has been sent to your email",
 *   "data": {
 *     "email": "user@example.com"
 *   }
 * }
 */
export class ResendOtpDto {
  /**
   * EMAIL - Địa chỉ email để gửi lại OTP
   *
   * Validators:
   * - @IsEmail(): Validate format email
   * - @IsNotEmpty(): Không được trống
   *
   * PROCESS GENERATE OTP:
   * ```typescript
   * // 1. Generate 6-digit random OTP
   * const otp = Math.floor(100000 + Math.random() * 900000).toString();
   * // Result: "123456"
   *
   * // 2. Hash OTP trước khi lưu database (security)
   * const hashedOtp = await bcrypt.hash(otp, 10);
   *
   * // 3. Lưu vào database
   * await otpRepo.save({
   *   userId: user.id,
   *   otp: hashedOtp,
   *   type: 'email_verification',
   *   expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
   *   createdAt: new Date()
   * });
   *
   * // 4. Gửi email (chứa OTP plain text)
   * await emailService.sendOTP(user.email, otp);
   * ```
   *
   * EMAIL TEMPLATE:
   * ---
   * Subject: Your Verification Code
   *
   * Hi {{firstName}},
   *
   * Your verification code is:
   *
   * {{otp}}
   *
   * This code expires in 10 minutes.
   * Do not share this code with anyone.
   * ---
   *
   * RATE LIMITING:
   * - Max 3 requests/5 phút per email
   * - Nếu vượt quá → throw TooManyRequestsException
   * - Reset counter sau 5 phút
   *
   * BẢO MẬT:
   * - OTP phải được hash trước khi lưu database
   * - Chỉ gửi OTP plain text qua email (SSL/TLS encrypted)
   * - OTP hết hạn sau 5-10 phút
   * - OTP chỉ dùng 1 lần
   * - Implement rate limiting để tránh spam
   * - Log mọi lần gửi OTP (audit trail)
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to resend OTP',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
