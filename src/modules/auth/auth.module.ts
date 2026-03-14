import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') || '15m') as any,
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    EmailVerificationService,
    RefreshTokenService,
    TokenBlacklistService,
    JwtStrategy,
    RefreshStrategy,
  ],
  exports: [AuthService, PasswordService, PassportModule],
})
export class AuthModule {}
