import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * ================================
 * VERIFY OTP DTO - Xác thực mã OTP
 * ================================
 *
 * DTO này dùng để xác thực OTP mà user nhập vào
 *
 * FLOW VERIFY OTP:
 * 1. User nhận OTP qua email/SMS (ví dụ: 123456)
 * 2. Nhập OTP vào form
 * 3. Gửi email + OTP đến API
 * 4. Server verify:
 *    a. Tìm OTP trong database theo email
 *    b. Kiểm tra còn hạn không (expiresAt > now)
 *    c. Kiểm tra chưa dùng chưa (used = false)
 *    d. So sánh OTP: bcrypt.compare(inputOtp, hashedOtp)
 * 5. Nếu hợp lệ:
 *    - Đánh dấu OTP đã dùng
 *    - Cập nhật user.emailVerified = true
 *    - Generate JWT token (optional)
 *    - Trả về thành công
 * 6. Nếu không hợp lệ:
 *    - Tăng fail counter
 *    - Nếu fail quá 3 lần → Khoá tạm thời 5 phút
 *    - throw BadRequestException: "Invalid or expired OTP"
 *
 * USE CASES:
 * - Xác thực email sau khi đăng ký
 * - 2FA login (Two-Factor Authentication)
 * - Xác nhận giao dịch quan trọng
 * - Xác thực thay đổi thông tin nhạy cảm
 *
 * @example
 * POST /auth/verify-otp
 * {
 *   "email": "user@example.com",
 *   "otp": "123456"
 * }
 *
 * Response thành công:
 * {
 *   "statusCode": 200,
 *   "success": true,
 *   "message": "Email verified successfully",
 *   "data": {
 *     "verified": true,
 *     "access_token": "eyJhbGci..."
 *   }
 * }
 */
export class VerifyOtpDto {
  /**
   * EMAIL - Địa chỉ email của user
   *
   * Validators:
   * - @IsEmail(): Validate format email
   * - @IsNotEmpty(): Không được trống
   *
   * Dùng để tìm OTP tương ứng trong database:
   * ```typescript
   * const otpRecord = await otpRepo.findOne({
   *   where: {
   *     userId: user.id,
   *     type: 'email_verification',
   *     used: false
   *   },
   *   order: { createdAt: 'DESC' }  // Lấy OTP mới nhất
   * });
   * ```
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * OTP - Mã xác thực 6 chữ số
   *
   * Validators:
   * - @IsString(): Phải là chuỗi
   * - @Length(6, 6): Đúng 6 ký tự (không nhiều hơn, không ít hơn)
   * - @IsNotEmpty(): Không được trống
   *
   * FORMAT:
   * - Chỉ chấp nhận số: "123456" ✓
   * - Không chấp nhận: "12345" ✗ (thiếu 1 số)
   * - Không chấp nhận: "1234567" ✗ (thừa 1 số)
   * - Không chấp nhận: "abc123" ✗ (có chữ cái)
   *
   * VERIFICATION PROCESS:
   * ```typescript
   * // 1. Tìm OTP record
   * const otpRecord = await otpRepo.findOne({
   *   where: { userId: user.id, used: false }
   * });
   *
   * // 2. Kiểm tra tồn tại
   * if (!otpRecord) {
   *   throw new BadRequestException('No OTP found or OTP already used');
   * }
   *
   * // 3. Kiểm tra hết hạn
   * if (otpRecord.expiresAt < new Date()) {
   *   throw new BadRequestException('OTP has expired');
   * }
   *
   * // 4. Verify OTP
   * const isValid = await bcrypt.compare(otp, otpRecord.otp);
   *
   * if (!isValid) {
   *   // Tăng fail counter
   *   await otpRepo.increment(
   *     { id: otpRecord.id },
   *     'failCount',
   *     1
   *   );
   *
   *   // Kiểm tra quá 3 lần fail
   *   if (otpRecord.failCount >= 2) { // 2 + 1 = 3 lần
   *     await otpRepo.update(
   *       { id: otpRecord.id },
   *       { lockedUntil: new Date(Date.now() + 5 * 60 * 1000) }
   *     );
   *     throw new BadRequestException(
   *       'Too many failed attempts. Try again in 5 minutes'
   *     );
   *   }
   *
   *   throw new BadRequestException('Invalid OTP');
   * }
   *
   * // 5. OTP hợp lệ → Đánh dấu đã dùng
   * await otpRepo.update(
   *   { id: otpRecord.id },
   *   { used: true, usedAt: new Date() }
   * );
   *
   * // 6. Cập nhật user emailVerified
   * await userRepo.update(
   *   { id: user.id },
   *   { emailVerified: true }
   * );
   *
   * // 7. Optional: Generate JWT token
   * const token = this.jwtService.sign({
   *   sub: user.id,
   *   email: user.email,
   *   role: user.role
   * });
   * ```
   *
   * BẢO MẬT:
   * - Rate limiting: Max 5 attempts/5 phút
   * - Khoá tạm thời sau 3 lần fail
   * - OTP hết hạn sau 10 phút
   * - OTP chỉ dùng 1 lần
   * - Log mọi lần verify (thành công và thất bại)
   *
   * USER EXPERIENCE:
   * - Hiển thị số lần thử còn lại: "2 attempts remaining"
   * - Hiển thị countdown: "OTP expires in 09:45"
   * - Nút "Resend OTP" nếu hết hạn
   */
  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code',
  })
  @IsString({ message: 'OTP must be a string' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @IsNotEmpty({ message: 'OTP is required' })
  otp: string;
}
