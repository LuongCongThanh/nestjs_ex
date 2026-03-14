import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { RegistrationResponseDto } from '@modules/auth/dto/registration-response.dto';
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as cryptoNode from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<RegistrationResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.passwordService.hash(registerDto.password);

    const savedUser = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
        emailVerified: false,
        isActive: true,
      },
    });

    const verificationToken = await this.emailVerificationService.createVerificationToken(savedUser.id);

    // Email Simulation...
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    console.log(`[EMAIL SIMULATION] To: ${savedUser.email}, Link: ${verificationLink}`);

    return {
      statusCode: 201,
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        email: savedUser.email,
        emailSent: true,
      },
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified.');
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);

    // Exclude password
    const { password, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword as any,
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  /**
   * Generate tokens
   */
  async generateTokens(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    const refreshPayload = { sub: user.id, type: 'refresh' };
    const refreshExpirationString = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    const refresh_token = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpirationString as any,
    });

    const expiresAt = this.calculateExpirationDate(refreshExpirationString);
    await this.refreshTokenService.createRefreshToken(refresh_token, user.id, expiresAt, deviceInfo, ipAddress);

    return { access_token, refresh_token };
  }

  private calculateExpirationDate(expirationString: string): Date {
    const now = new Date();
    const unit = expirationString.slice(-1);
    const value = parseInt(expirationString.slice(0, -1), 10);

    switch (unit) {
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  private parseJwtExpiration(expirationString: string): number {
    const unit = expirationString.slice(-1);
    const value = parseInt(expirationString.slice(0, -1), 10);
    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`);
      return;
    }

    const token = cryptoNode.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getHours() + 1); // 1 hour for reset

    await this.prisma.resetToken.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
      },
    });

    console.log(`[EMAIL SIMULATION] Reset link: https://example.com/reset-password?token=${token}`);
  }

  async refreshToken(refreshToken: string, deviceInfo?: string, ipAddress?: string): Promise<AuthResponseDto> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedToken = await this.refreshTokenService.validateRefreshToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or disabled');
    }

    await this.refreshTokenService.deleteToken(refreshToken);
    const tokens = await this.generateTokens(user, deviceInfo, ipAddress);

    const { password, ...userWithoutPassword } = user;
    return {
      ...tokens,
      user: userWithoutPassword as any,
    };
  }

  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    await this.refreshTokenService.revokeToken(refreshToken);
    const tokenExpiration = new Date(
      Date.now() + this.parseJwtExpiration(this.configService.get<string>('JWT_EXPIRATION') || '15m'),
    );
    await this.tokenBlacklistService.addToBlacklist(accessToken, userId, 'logout', tokenExpiration);
  }

  async logoutAll(userId: string, accessToken: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
    const tokenExpiration = new Date(
      Date.now() + this.parseJwtExpiration(this.configService.get<string>('JWT_EXPIRATION') || '15m'),
    );
    await this.tokenBlacklistService.addToBlacklist(accessToken, userId, 'logout', tokenExpiration);
  }
}
