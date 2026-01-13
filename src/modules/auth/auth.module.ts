import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { ResetToken } from './entities/reset-token.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';

/**
 * ================================
 * AUTH MODULE - Quản lý Authentication & Authorization (2026 Implementation)
 * ================================
 *
 * Module này chịu trách nhiệm:
 * 1. Đăng ký & Đăng nhập người dùng (Register & Login)
 * 2. Xác thực email (Email Verification) - MANDATORY 2026
 * 3. Xác thực JWT token (JWT Authentication)
 * 4. Phân quyền theo role (Role-Based Access Control)
 * 5. Quản lý token blacklist (Token Revocation)
 * 6. Quản lý session với refresh tokens
 *
 * FLOW HOẠT ĐỘNG (2026 Updated):
 * ---------------
 * 1. User đăng ký → AuthController nhận request
 * 2. AuthService tạo user (emailVerified = false)
 * 3. EmailVerificationService tạo token
 * 4. Gửi email verification link (NO JWT tokens yet)
 * 5. User click link → verify email
 * 6. User đăng nhập → kiểm tra emailVerified = true
 * 7. Trả về JWT tokens (access + refresh)
 * 8. Client gửi token trong header: Authorization: Bearer <token>
 * 9. JwtAuthGuard + JwtStrategy validate token
 * 10. RolesGuard kiểm tra quyền truy cập
 *
 * 2026 Security Improvements:
 * - Email verification is mandatory (P0 priority)
 * - Password hashing uses bcrypt 12 rounds (up from 10)
 * - Separated services (PasswordService, EmailVerificationService)
 * - Token rotation on refresh
 * - Access token lifetime: 10-15 minutes (down from 15-30)
 */
@Module({
  imports: [
    // Import TypeORM repositories để truy vấn database
    // - User: Quản lý thông tin người dùng
    // - TokenBlacklist: Quản lý các token bị thu hồi
    // - ResetToken: Quản lý token reset password
    // - RefreshToken: Quản lý refresh tokens cho session management
    // - EmailVerificationToken: Quản lý email verification tokens (NEW 2026)
    TypeOrmModule.forFeature([User, TokenBlacklist, ResetToken, RefreshToken, EmailVerificationToken]),

    // Đăng ký Passport với strategy mặc định là JWT
    // Passport là framework để handle authentication
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Cấu hình JWT Module động (async) để lấy config từ environment
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule để đọc .env
      inject: [ConfigService], // Inject ConfigService
      useFactory: (configService: ConfigService) => ({
        // Secret key để sign JWT token (từ .env: JWT_SECRET)
        // Đây là key quan trọng nhất, phải giữ bí mật tuyệt đối
        secret: configService.get<string>('JWT_SECRET'),

        // Cấu hình options khi sign token
        signOptions: {
          // Thời gian token hết hạn (từ .env: JWT_EXPIRATION)
          // 2026 Recommendation: 10-15 minutes (giảm từ 15-30 minutes)
          expiresIn: (configService.get<string>('JWT_EXPIRATION') || '15m') as any,
        },
      }),
    }),
  ],

  // Controllers - Xử lý HTTP requests
  controllers: [AuthController],

  // Providers - Services và strategies
  providers: [
    AuthService, // Service chứa business logic (register, login, validateUser)
    PasswordService, // 🆕 Service quản lý password hashing (bcrypt 12 rounds)
    EmailVerificationService, // 🆕 Service quản lý email verification tokens
    JwtStrategy, // Strategy để validate JWT token từ request header
    RefreshStrategy, // Strategy để validate refresh token
    JwtAuthGuard, // Guard để protect routes (require JWT token)
    RolesGuard, // Guard để kiểm tra user role (admin, user, etc)
    TokenBlacklistService, // Service quản lý token blacklist (logout, revoke)
    RefreshTokenService, // Service quản lý refresh tokens (create, validate, revoke)
  ],

  // Exports - Cho phép modules khác sử dụng
  // Các module khác import AuthModule sẽ có thể dùng những thứ này
  exports: [
    AuthService, // Để modules khác có thể gọi validateUser, login, etc
    PasswordService, // 🆕 Để hash passwords ở modules khác (e.g., users module)
    EmailVerificationService, // 🆕 Để verify emails ở modules khác
    JwtStrategy, // Để sử dụng JWT authentication ở modules khác
    RefreshStrategy, // Để sử dụng refresh token strategy ở modules khác
    PassportModule, // Để sử dụng Passport ở modules khác
    JwtAuthGuard, // Để protect routes ở modules khác với @UseGuards(JwtAuthGuard)
    RolesGuard, // Để check roles ở modules khác với @Roles(UserRole.ADMIN)
    TokenBlacklistService, // Để revoke tokens từ modules khác (ví dụ: logout)
    RefreshTokenService, // Để quản lý refresh tokens từ modules khác
  ],
})
export class AuthModule {}
