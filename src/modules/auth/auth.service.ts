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
import { PasswordService } from '@common/services/password.service';
import { addDuration, parseDurationMs } from '@common/utils/duration.util';
import { hashToken, getTokenLookupVariants } from '@common/utils/token-hash.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailVerificationService } from './services/email-verification.service';
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

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<RegistrationResponseDto> {
    const normalizedEmail = this.normalizeEmail(registerDto.email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.passwordService.hash(registerDto.password);

    const savedUser = await this.prisma.user.create({
      data: {
        ...registerDto,
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: false,
        isActive: true,
      },
    });

    const verificationToken = await this.emailVerificationService.createVerificationToken(savedUser.id);

    // Email Simulation...
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    this.logger.log(`[EMAIL SIMULATION] To: ${savedUser.email}, Link: ${verificationLink}`);

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
    const normalizedEmail = this.normalizeEmail(loginDto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async validateUser(payload: JwtPayload): Promise<Pick<User, 'id' | 'email' | 'role' | 'isActive'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user?.isActive) {
      return null;
    }

    return user;
  }

  /**
   * Generate tokens
   */
  async generateTokens(
    user: Pick<User, 'id' | 'email' | 'role'>,
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
      expiresIn: Math.floor(parseDurationMs(refreshExpirationString) / 1000),
    });

    const expiresAt = addDuration(new Date(), refreshExpirationString);
    await this.refreshTokenService.createRefreshToken(refresh_token, user.id, expiresAt, deviceInfo, ipAddress);

    return { access_token, refresh_token };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const normalizedEmail = this.normalizeEmail(forgotPasswordDto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${normalizedEmail}`);
      return;
    }

    const token = cryptoNode.randomBytes(32).toString('hex');
    const hashedToken = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour for reset

    await this.prisma.resetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: expiresAt,
      },
    });

    this.logger.log(`[EMAIL SIMULATION] Reset link: https://example.com/reset-password?token=${token}`);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verificationToken = await this.emailVerificationService.validateToken(token);

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await this.emailVerificationService.markAsUsed(verificationToken.id);

    return { message: 'Email verified successfully! You can now login.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenVariants = getTokenLookupVariants(resetPasswordDto.token);

    const resetToken = await this.prisma.resetToken.findFirst({
      where: {
        token: {
          in: tokenVariants,
        },
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    const hashedPassword = await this.passwordService.hash(resetPasswordDto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
      this.prisma.resetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  async refreshToken(refreshToken: string, deviceInfo?: string, ipAddress?: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isConsumed = await this.refreshTokenService.consumeRefreshToken(refreshToken);
    if (!isConsumed) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('User not found or disabled');
    }

    const tokens = await this.generateTokens(user, deviceInfo, ipAddress);

    return {
      ...tokens,
      user: user,
    };
  }

  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    await this.refreshTokenService.revokeToken(refreshToken);
    const tokenExpiration = new Date(
      Date.now() + parseDurationMs(this.configService.get<string>('JWT_EXPIRATION') || '15m'),
    );
    await this.tokenBlacklistService.addToBlacklist(accessToken, userId, 'logout', tokenExpiration);
  }

  async logoutAll(userId: string, accessToken: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
    const tokenExpiration = new Date(
      Date.now() + parseDurationMs(this.configService.get<string>('JWT_EXPIRATION') || '15m'),
    );
    await this.tokenBlacklistService.addToBlacklist(accessToken, userId, 'logout', tokenExpiration);
  }
}
