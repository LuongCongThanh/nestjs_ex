import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { ResetToken } from './entities/reset-token.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';

/**
 * ================================
 * AUTH MODULE - Quản lý Authentication & Authorization
 * ================================
 *
 * Module này chịu trách nhiệm:
 * 1. Đăng ký & Đăng nhập người dùng (Register & Login)
 * 2. Xác thực JWT token (JWT Authentication)
 * 3. Phân quyền theo role (Role-Based Access Control)
 * 4. Quản lý token blacklist (Token Revocation)
 *
 * FLOW HOẠT ĐỘNG:
 * ---------------
 * 1. User đăng ký/đăng nhập → AuthController nhận request
 * 2. AuthService xử lý logic (hash password, generate JWT)
 * 3. Trả về JWT token cho client
 * 4. Client gửi token trong header: Authorization: Bearer <token>
 * 5. JwtAuthGuard + JwtStrategy validate token
 * 6. RolesGuard kiểm tra quyền truy cập
 * 7. Cho phép/từ chối truy cập resource
 */
@Module({
  imports: [
    // Import TypeORM repositories để truy vấn database
    // - User: Quản lý thông tin người dùng
    // - TokenBlacklist: Quản lý các token bị thu hồi
    TypeOrmModule.forFeature([User, TokenBlacklist, ResetToken]),

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
          // Thời gian token hết hạn (từ .env: JWT_EXPIRATION, default: 7 ngày)
          // Token hết hạn → user phải login lại
          expiresIn: (configService.get<string>('JWT_EXPIRATION') ||
            '7d') as any,
        },
      }),
    }),
  ],

  // Controllers - Xử lý HTTP requests
  controllers: [AuthController],

  // Providers - Services và strategies
  providers: [
    AuthService, // Service chứa business logic (register, login, validateUser)
    JwtStrategy, // Strategy để validate JWT token từ request header
    JwtAuthGuard, // Guard để protect routes (require JWT token)
    RolesGuard, // Guard để kiểm tra user role (admin, user, etc)
    TokenBlacklistService, // Service quản lý token blacklist (logout, revoke)
  ],

  // Exports - Cho phép modules khác sử dụng
  // Các module khác import AuthModule sẽ có thể dùng những thứ này
  exports: [
    AuthService, // Để modules khác có thể gọi validateUser, login, etc
    JwtStrategy, // Để sử dụng JWT authentication ở modules khác
    PassportModule, // Để sử dụng Passport ở modules khác
    JwtAuthGuard, // Để protect routes ở modules khác với @UseGuards(JwtAuthGuard)
    RolesGuard, // Để check roles ở modules khác với @Roles(UserRole.ADMIN)
    TokenBlacklistService, // Để revoke tokens từ modules khác (ví dụ: logout)
  ],
})
export class AuthModule {}
