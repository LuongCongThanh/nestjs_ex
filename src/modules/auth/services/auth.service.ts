import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserRole } from '../../../entities/user.entity';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { AuthUserService } from './auth-user.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { MailService } from '../../mail/services/mail.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AUTH_CONFIG, TOKEN_TYPES } from '../auth.constants';

/**
 * Auth Service - The main orchestrator for authentication flows.
 * Adheres to the Facade pattern by coordinating specialized services to complete
 * complex operations like registration, login, and password management.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authUserService: AuthUserService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Orchestrates the registration of a new user.
   * Steps:
   * 1. Check uniqueness
   * 2. Hash password
   * 3. Save user entity
   * 4. Send verification email.
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.authUserService.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('Email already exists');

    const hashedPassword = await this.passwordService.hashPassword(dto.password);

    const user = this.authUserService.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.USER,
      emailVerified: false,
    });
    const savedUser = await this.authUserService.save(user);

    const verificationToken = this.tokenService.generateStatelessToken(
      { sub: savedUser.id, type: TOKEN_TYPES.VERIFY_EMAIL },
      'verify',
    );

    try {
      await this.mailService.sendVerificationEmail(savedUser.email, savedUser.firstName, verificationToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send verification email for ${savedUser.email}: ${errorMessage}`, errorStack);
      await this.authUserService.delete(savedUser.id);
      throw new ServiceUnavailableException('Unable to send verification email. Please try again later.');
    }

    return {
      success: true,
      statusCode: 201,
      message: 'Registration successful. Please check your email for verification.',
    };
  }

  /**
   * Verifies a user's email using a stateless verification token.
   */
  async verifyEmail(token: string) {
    const payload = this.tokenService.verifyStatelessToken(token, 'verify');
    if (payload.type !== TOKEN_TYPES.VERIFY_EMAIL) {
      throw new BadRequestException('Invalid token type');
    }

    const user = await this.authUserService.findById(payload.sub);
    if (!user) throw new BadRequestException('User not found');

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    user.emailVerified = true;
    await this.authUserService.save(user);

    return { success: true, message: 'Email verified successfully!' };
  }

  /**
   * Triggers a resend of the verification email if the user exists and isn't verified.
   */
  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.authUserService.findByEmail(dto.email);
    if (!user) {
      return { success: true, message: 'If the account exists, a verification email has been sent.' };
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified.' };
    }

    const verificationToken = this.tokenService.generateStatelessToken(
      { sub: user.id, type: TOKEN_TYPES.VERIFY_EMAIL },
      'verify',
    );

    try {
      await this.mailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to resend verification email for ${user.email}: ${errorMessage}`, errorStack);
      throw new ServiceUnavailableException('Unable to send verification email. Please try again later.');
    }

    return { success: true, message: 'Verification email sent.' };
  }

  /**
   * Authenticates a user by email and password.
   * Performs account status checks (active/verified) and generates a full auth response.
   */
  async login(dto: LoginDto, userAgent: string, ipAddress: string) {
    const user = await this.authUserService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await this.passwordService.comparePassword(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    if (!user.isActive) throw new ForbiddenException('Account is disabled');
    if (!user.emailVerified) throw new ForbiddenException('Email not verified');

    return this.generateAuthResponse(user, userAgent, ipAddress, {
      updateLastLogin: true,
      revokeSameDevice: true,
    });
  }

  /**
   * Refreshes Access and Refresh tokens using a valid Refresh Token.
   * Implements token rotation and session validation (device matching).
   */
  async refresh(dto: RefreshTokenDto, userAgent: string, ipAddress: string) {
    let payload: JwtPayload;
    try {
      payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.sessionService.findRefreshToken(dto.refreshToken);
    if (!storedToken || !storedToken.user || storedToken.user.id !== payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!storedToken.user.isActive || !storedToken.user.emailVerified) {
      await this.sessionService.revokeAllUserTokens(storedToken.user.id);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.userAgent && userAgent && storedToken.userAgent !== userAgent) {
      await this.sessionService.revokeRefreshToken(dto.refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.sessionService.revokeRefreshToken(dto.refreshToken);

    return this.generateAuthResponse(storedToken.user, userAgent, ipAddress);
  }

  /**
   * Revokes the provided Refresh Token, effectively logging the user out of that session.
   */
  async logout(dto: RefreshTokenDto) {
    await this.sessionService.revokeRefreshToken(dto.refreshToken);
    return { success: true, message: 'Logout successful' };
  }

  /**
   * Orchestrates the forgot password flow.
   * Generates a reset token and sends a reset link via email.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.authUserService.findByEmail(dto.email);
    if (!user) return { success: true, message: 'Check your email to reset password' };

    const resetToken = this.tokenService.generateStatelessToken(
      { sub: user.id, type: TOKEN_TYPES.RESET_PASSWORD },
      'reset',
    );

    const expiresAt = new Date(Date.now() + AUTH_CONFIG.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    await this.sessionService.createPasswordResetToken(user.id, resetToken, expiresAt);

    try {
      await this.mailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send password reset email for ${user.email}: ${errorMessage}`, errorStack);
      await this.sessionService.deletePasswordResetToken(resetToken);
      throw new ServiceUnavailableException('Unable to send password reset email. Please try again later.');
    }

    return { success: true, message: 'Check your email to reset password' };
  }

  /**
   * Resets a user's password using a valid reset token.
   * Revokes all active sessions upon successful reset.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const payload = this.tokenService.verifyStatelessToken(dto.token, 'reset');
    if (payload.type !== TOKEN_TYPES.RESET_PASSWORD) {
      throw new BadRequestException('Invalid token type');
    }

    const resetTokenRecord = await this.sessionService.findPasswordResetToken(dto.token, payload.sub);
    if (!resetTokenRecord || resetTokenRecord.usedAt || resetTokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const user = await this.authUserService.findById(payload.sub);
    if (!user) throw new BadRequestException('User not found');

    user.password = await this.passwordService.hashPassword(dto.newPassword);
    await this.authUserService.save(user);

    await this.sessionService.revokeAllUserTokens(user.id);
    await this.sessionService.markPasswordResetTokenAsUsed(resetTokenRecord.id);
    await this.sessionService.cleanupPasswordResetTokens(user.id);

    return { success: true, message: 'Password updated successfully!' };
  }

  /**
   * Changes an authenticated user's password.
   * Requires the old password for confirmation.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.authUserService.findById(userId);
    if (!user) throw new UnauthorizedException();

    const isMatch = await this.passwordService.comparePassword(dto.oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Incorrect old password');

    user.password = await this.passwordService.hashPassword(dto.newPassword);
    await this.authUserService.save(user);

    await this.sessionService.revokeAllUserTokens(userId);

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Internal helper to generate a standardized authentication response.
   * Handles token generation, session enforcement, and last login updates.
   */
  private async generateAuthResponse(
    user: User,
    userAgent: string,
    ipAddress: string,
    options?: { updateLastLogin?: boolean; revokeSameDevice?: boolean },
  ) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    const refreshPayload = this.tokenService.verifyRefreshToken(refreshToken);
    const expiresAt = refreshPayload?.exp
      ? new Date(refreshPayload.exp * 1000)
      : new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.sessionService.enforceMaxSessions(
      user.id,
      options?.revokeSameDevice ? userAgent : undefined,
      options?.revokeSameDevice ? ipAddress : undefined,
    );

    await this.sessionService.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
    });

    if (options?.updateLastLogin) {
      await this.authUserService.update(user.id, { lastLoginAt: new Date() });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user as any;

    return {
      success: true,
      accessToken,
      refreshToken,
      user: userWithoutPassword as User,
    };
  }
}
