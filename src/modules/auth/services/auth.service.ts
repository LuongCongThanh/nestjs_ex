import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from '../../../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { MailService } from '../../mail/services/mail.service';
import { ResendVerificationDto } from '../dto/resend-verification.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException('Email already exists');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.USER,
      emailVerified: false,
    });
    const savedUser = await this.userRepository.save(user);

    const verificationToken = this.tokenService.generateStatelessToken(
      { sub: savedUser.id, type: 'verify_email' },
      'verify',
    );

    try {
      await this.mailService.sendVerificationEmail(savedUser.email, savedUser.firstName, verificationToken);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email for ${savedUser.email}: ${error?.message || error}`,
        error?.stack,
      );
      // Roll back user creation so the email can be reused on retry
      await this.userRepository.delete(savedUser.id);
      throw new ServiceUnavailableException('Unable to send verification email. Please try again later.');
    }

    return { 
      success: true, 
      statusCode: 201, 
      message: 'Registration successful. Please check your email for verification.' 
    };
  }

  async verifyEmail(token: string) {
    let payload: any;
    try {
      payload = this.tokenService.verifyStatelessToken(token, 'verify');
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification link.');
    }

    if (!payload || payload.type !== 'verify_email') {
      throw new BadRequestException('Invalid or expired verification link.');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) throw new BadRequestException('User not found');

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    user.emailVerified = true;
    await this.userRepository.save(user);

    return { success: true, message: 'Email verified successfully!' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      // Avoid email enumeration; still return success
      return { success: true, message: 'If the account exists, a verification email has been sent.' };
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified.' };
    }

    const verificationToken = this.tokenService.generateStatelessToken(
      { sub: user.id, type: 'verify_email' },
      'verify',
    );

    try {
      await this.mailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email for ${user.email}: ${error?.message || error}`,
        error?.stack,
      );
      throw new ServiceUnavailableException('Unable to send verification email. Please try again later.');
    }

    return { success: true, message: 'Verification email sent.' };
  }

  async login(dto: LoginDto, userAgent: string, ipAddress: string) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedException('Account is disabled');
    if (!user.emailVerified) throw new UnauthorizedException('Email not verified');

    return this.generateAuthResponse(user, userAgent, ipAddress, {
      updateLastLogin: true,
      revokeSameDevice: true,
    });
  }

  async refresh(dto: RefreshTokenDto, userAgent: string, ipAddress: string) {
    // Verify signature & expiry first
    let payload: any;
    try {
      payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is still whitelisted in DB (allows revocation/rotation)
    const hashedToken = this.hashToken(dto.refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: hashedToken },
      relations: ['user'],
    });

    if (!storedToken || !storedToken.user || storedToken.user.id !== payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Block refresh for disabled or unverified accounts and clean up tokens
    if (!storedToken.user.isActive || !storedToken.user.emailVerified) {
      await this.refreshTokenRepository.delete({ userId: storedToken.user.id });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Enforce same device (userAgent) for refresh; IP optional for leniency
    if (storedToken.userAgent && userAgent && storedToken.userAgent !== userAgent) {
      await this.refreshTokenRepository.remove(storedToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token (Rotation)
    await this.refreshTokenRepository.remove(storedToken);

    return this.generateAuthResponse(storedToken.user, userAgent, ipAddress);
  }

  async logout(dto: RefreshTokenDto) {
    await this.refreshTokenRepository.delete({ token: this.hashToken(dto.refreshToken) });
    return { success: true, message: 'Logout successful' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) return { success: true, message: 'Check your email to reset password' };

    const resetToken = this.tokenService.generateStatelessToken(
      { sub: user.id, type: 'reset_password' },
      'reset',
    );

    // Persist hashed token for single-use enforcement
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // matches token TTL
    const hashedResetToken = this.hashToken(resetToken);
    const resetTokenEntity = this.passwordResetTokenRepository.create({
      token: hashedResetToken,
      userId: user.id,
      expiresAt,
      usedAt: null,
    });
    await this.passwordResetTokenRepository.save(resetTokenEntity);

    // Send Real Email
    try {
      await this.mailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email for ${user.email}: ${error?.message || error}`,
        error?.stack,
      );
      await this.passwordResetTokenRepository.delete({ token: hashedResetToken });
      throw new ServiceUnavailableException('Unable to send password reset email. Please try again later.');
    }

    return { success: true, message: 'Check your email to reset password' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = this.tokenService.verifyStatelessToken(dto.token, 'reset');
    } catch (error) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    if (!payload || payload.type !== 'reset_password') {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const hashedResetToken = this.hashToken(dto.token);
    const resetTokenRecord = await this.passwordResetTokenRepository.findOne({
      where: { token: hashedResetToken, userId: payload.sub },
    });

    if (!resetTokenRecord || resetTokenRecord.usedAt || resetTokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) throw new BadRequestException('User not found');

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(dto.newPassword, salt);
    await this.userRepository.save(user);

    // Force logout all devices
    await this.refreshTokenRepository.delete({ userId: user.id });
    // Mark this reset token as used and clean up any others for safety
    await this.passwordResetTokenRepository.update(resetTokenRecord.id, { usedAt: new Date() });
    await this.passwordResetTokenRepository.delete({ userId: user.id, usedAt: null });

    return { success: true, message: 'Password updated successfully!' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Incorrect old password');

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(dto.newPassword, salt);
    await this.userRepository.save(user);

    // Revoke all active refresh tokens for this user
    await this.refreshTokenRepository.delete({ userId });

    return { success: true, message: 'Password changed successfully' };
  }

  private async generateAuthResponse(
    user: User,
    userAgent: string,
    ipAddress: string,
    options?: { updateLastLogin?: boolean; revokeSameDevice?: boolean },
  ) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshTokenDetails = this.tokenService.generateRefreshToken(payload);
    const refreshPayload = this.tokenService.verifyRefreshToken(refreshTokenDetails);
    const expiresAt = refreshPayload?.exp ? new Date(refreshPayload.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const hashedRefreshToken = this.hashToken(refreshTokenDetails);

    // Optional: revoke same-device tokens to avoid piling up duplicates
    if (options?.revokeSameDevice) {
      await this.refreshTokenRepository.delete({ userId: user.id, userAgent, ipAddress });
    }

    // Enforce maximum active sessions (keep most recent N)
    const maxSessions = 5;
    const existingTokens = await this.refreshTokenRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'ASC' }, // oldest first
    });
    const tokensToDelete = existingTokens.length - maxSessions + 1; // +1 includes the one we're about to add
    if (tokensToDelete > 0) {
      const idsToRemove = existingTokens.slice(0, tokensToDelete).map((t) => t.id);
      if (idsToRemove.length) {
        await this.refreshTokenRepository.delete(idsToRemove);
      }
    }

    // Save refresh token to DB
    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: hashedRefreshToken,
      userId: user.id,
      userAgent,
      ipAddress,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    // Update last login only when explicitly requested (e.g., interactive login)
    if (options?.updateLastLogin) {
      await this.userRepository.update(user.id, { lastLoginAt: new Date() });
    }

    // Exclude password
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      accessToken,
      refreshToken: refreshTokenDetails,
      user: userWithoutPassword,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
