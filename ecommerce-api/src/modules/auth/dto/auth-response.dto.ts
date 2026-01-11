import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

/**
 * ================================
 * AUTH RESPONSE DTO - Response sau khi đăng ký/đăng nhập
 * ================================
 *
 * DTO này định nghĩa cấu trúc response trả về sau khi:
 * 1. Đăng ký thành công (POST /auth/register)
 * 2. Đăng nhập thành công (POST /auth/login)
 *
 * RESPONSE FORMAT:
 * {
 *   "statusCode": 200,
 *   "success": true,
 *   "message": "User logged in successfully",
 *   "data": {
 *     "access_token": "eyJhbGci...",  ← JWT token
 *     "user": { id, email, ... }       ← User info (NO PASSWORD)
 *   }
 * }
 *
 * LƯU Ý:
 * - Response thực tế được wrap bởi TransformResponseInterceptor
 * - DTO này chỉ định nghĩa phần "data" bên trong
 * - Password KHÔNG BAO GIỜ có trong response
 */
export class AuthResponseDto {
  /**
   * ACCESS TOKEN - JWT Token để authentication
   *
   * CẤU TRÚC JWT TOKEN:
   * "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDUwMDAwMDAsImV4cCI6MTcwNTYwNDgwMH0.signature"
   *
   * 3 phần cách nhau bởi dấu chấm (.)
   * 1. Header: { alg: "HS256", typ: "JWT" }
   * 2. Payload: { sub: user.id, email, role, iat, exp }
   * 3. Signature: HMACSHA256(header.payload, SECRET_KEY)
   *
   * CÁCH SỬ DỤNG:
   * Client lưu token này (localStorage, sessionStorage, cookie)
   * Gửi trong header của các request tiếp theo:
   * Authorization: Bearer <access_token>
   *
   * TOKEN EXPIRATION:
   * - Mặc định: 7 ngày (config trong .env: JWT_EXPIRATION)
   * - Sau khi hết hạn → User phải login lại
   * - Server tự động reject token hết hạn
   */
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    description: 'JWT access token',
  })
  access_token: string;

  /**
   * USER - Thông tin người dùng
   *
   * Chứa tất cả thông tin user EXCEPT password:
   * - id: UUID của user
   * - email: Địa chỉ email
   * - firstName: Tên
   * - lastName: Họ
   * - phone: Số điện thoại (optional)
   * - role: Vai trò (user, admin, etc)
   * - isActive: Trạng thái tài khoản
   * - emailVerified: Email đã xác thực chưa
   * - createdAt: Ngày tạo tài khoản
   * - updatedAt: Ngày cập nhật cuối
   *
   * BẢO MẬT:
   * - Password được loại bỏ bằng object destructuring trong Service
   * - const { password: _, ...userWithoutPassword } = user
   * - KHÔNG BAO GIỜ trả password về client
   */
  @ApiProperty({
    type: UserResponseDto,
    description: 'User information (password excluded)',
  })
  user: UserResponseDto;
}
