import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ResendVerificationLinkDto } from '@modules/auth/dto/resend-verification-link.dto';
import { RegistrationResponseDto } from '@modules/auth/dto/registration-response.dto';
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as cryptoNode from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { ResetToken } from './entities/reset-token.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ResetToken)
    private readonly resetTokenRepository: Repository<ResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * Register a new user (2026 Security Implementation)
   *
   * Flow (Updated):
   * 1. Check if email already exists
   * 2. Hash password with bcrypt 12 rounds (2026 standard)
   * 3. Create user with emailVerified = false
   * 4. Generate email verification token
   * 5. Send verification email with link
   * 6. Return success message (NO JWT tokens)
   *
   * Security Changes from Old Implementation:
   * - Does NOT return JWT tokens immediately
   * - User must verify email before login
   * - Uses bcrypt 12 rounds instead of 10
   * - Dedicated PasswordService for hashing
   * - Dedicated EmailVerificationService for tokens
   *
   * @param registerDto - Registration data from user
   * @returns RegistrationResponseDto (no tokens, just confirmation)
   */
  async register(registerDto: RegisterDto): Promise<RegistrationResponseDto> {
    // Step 1: Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
      select: ['id'], // Only select id for existence check
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Step 2: Hash password with PasswordService (bcrypt 12 rounds)
    const hashedPassword = await this.passwordService.hash(registerDto.password);

    // Step 3: Create user entity with emailVerified = false
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      emailVerified: false, // User must verify email before login
      isActive: true,
    });

    // Save to database
    const savedUser = await this.userRepository.save(user);

    // Step 4: Generate email verification token
    const verificationToken = await this.emailVerificationService.createVerificationToken(savedUser.id);

    // Step 5: Send verification email with link
    // TODO: Replace with actual email service (SendGrid, AWS SES, etc.)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    console.log(`
      ======================================================
      [EMAIL SIMULATION - VERIFICATION]
      To: ${savedUser.email}
      Subject: Verify Your Email Address
      
      Hello ${savedUser.firstName},
      
      Thank you for registering! Please verify your email address
      by clicking the link below:
      
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
      ======================================================
    `);

    this.logger.log(`User registered successfully: ${savedUser.email} (email verification required)`);

    // Step 6: Return success response (NO JWT tokens)
    return {
      statusCode: 201,
      success: true,
      message: 'Registration successful! Please check your email to verify your account before logging in.',
      data: {
        email: savedUser.email,
        emailSent: true,
      },
    };
  }

  /**
   * Verify user's email address using a secure token
   *
   * @param token - Secure hex token from email link
   */
  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    const verificationToken = await this.emailVerificationService.validateToken(token);

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    // Step 1: Update user's emailVerified status
    await this.userRepository.update(verificationToken.userId, {
      emailVerified: true,
    });

    // Step 2: Mark token as used
    await this.emailVerificationService.markAsUsed(verificationToken.id);

    this.logger.log(`Email verified successfully for user ${verificationToken.userId}`);

    return { verified: true };
  }

  /**
   * Resend verification link to user
   *
   * @param resendDto - DTO containing user email
   */
  async resendVerificationLink(resendDto: ResendVerificationLinkDto): Promise<{ emailSent: boolean }> {
    const user = await this.userRepository.findOne({
      where: { email: resendDto.email },
      select: ['id', 'email', 'firstName', 'emailVerified'],
    });

    // Security: Silent success if user doesn't exist to prevent enumeration
    if (!user) {
      this.logger.warn(`Verification link resend requested for non-existent email: ${resendDto.email}`);
      return { emailSent: true };
    }

    // If already verified, also silent success
    if (user.emailVerified) {
      this.logger.log(`Verification link resend requested for already verified user: ${resendDto.email}`);
      return { emailSent: true };
    }

    // Revoke old tokens if any
    await this.emailVerificationService.revokeUserTokens(user.id);

    // Generate new token
    const token = await this.emailVerificationService.createVerificationToken(user.id);

    // Send email (Simulation)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    console.log(`
      ======================================================
      [EMAIL SIMULATION - RESEND VERIFICATION]
      To: ${user.email}
      Subject: Verify Your Email Address
      
      Hello ${user.firstName},
      
      You requested a new verification link. Please click below:
      
      ${verificationLink}
      
      This link will expire in 24 hours.
      ======================================================
    `);

    return { emailSent: true };
  }

  /**
   * Login user (2026 Security Implementation)
   *
   * Flow (Updated):
   * 1. Find user by email
   * 2. Verify password with PasswordService
   * 3. Check if user is active
   * 4. Check if email is verified (NEW - 2026 requirement)
   * 5. Generate JWT tokens
   * 6. Return tokens and user info (without password)
   *
   * Security Changes from Old Implementation:
   * - Uses PasswordService.compare() instead of bcrypt directly
   * - Checks emailVerified = true before issuing tokens
   * - Throws specific error if email not verified
   *
   * @param loginDto - Login credentials from user
   * @returns AuthResponseDto with tokens and user data
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
        'emailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password with PasswordService
    const isPasswordValid = await this.passwordService.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
    }

    // 🆕 2026 Security: Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please check your inbox for the verification link or request a new one.',
      );
    }

    // Exclude password from response
    const userWithoutPassword = user as Omit<User, 'password'>;

    // Update last login timestamp
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    // Generate JWT tokens (access + refresh)
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: userWithoutPassword as User,
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
        'emailVerified',
        'createdAt',
        'updatedAt',
      ], // Exclude password from selection
    });

    if (!user) {
      return null;
    }

    return user;
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokens(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
    tokenFamilyId?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token (short-lived: 15-30 minutes)
    const access_token = this.jwtService.sign(payload);

    // Generate refresh token (long-lived: 7-30 days) with separate secret
    const refreshPayload = { sub: user.id, type: 'refresh' };
    const refreshExpirationString = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    const refresh_token = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpirationString as any,
    });

    // Calculate refresh token expiration date
    const expiresAt = this.calculateExpirationDate(refreshExpirationString);

    // Store refresh token in database
    await this.refreshTokenService.createRefreshToken(
      refresh_token,
      user.id,
      expiresAt,
      deviceInfo,
      ipAddress,
      tokenFamilyId,
    );

    return { access_token, refresh_token };
  }

  /**
   * Calculate expiration date from JWT expiration string (e.g., '7d', '30d', '24h')
   */
  private calculateExpirationDate(expirationString: string): Date {
    const now = new Date();
    const unit = expirationString.slice(-1);
    const value = Number.parseInt(expirationString.slice(0, -1), 10);

    switch (unit) {
      case 'd': // days
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h': // hours
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm': // minutes
        return new Date(now.getTime() + value * 60 * 1000);
      case 's': // seconds
        return new Date(now.getTime() + value * 1000);
      default:
        // Default to 7 days if format is unknown
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Parse JWT expiration string to milliseconds
   */
  private parseJwtExpiration(expirationString: string): number {
    const unit = expirationString.slice(-1);
    const value = Number.parseInt(expirationString.slice(0, -1), 10);

    switch (unit) {
      case 'd': // days
        return value * 24 * 60 * 60 * 1000;
      case 'h': // hours
        return value * 60 * 60 * 1000;
      case 'm': // minutes
        return value * 60 * 1000;
      case 's': // seconds
        return value * 1000;
      default:
        // Default to 15 minutes
        return 15 * 60 * 1000;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Security: Do not reveal if email exists or not (silent fail)
      // Return success to prevent email enumeration attacks
      this.logger.warn(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`);
      return;
    }

    // Generate random token
    const token = cryptoNode.randomBytes(32).toString('hex');

    // Create reset token entity
    // Expires in 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const resetToken = this.resetTokenRepository.create({
      userId: user.id,
      token: token,
      expiresAt: expiresAt,
    });

    await this.resetTokenRepository.save(resetToken);

    // TODO: Send email
    // For now, log to console
    console.log(`
      ======================================================
      [EMAIL SIMULATION]
      To: ${user.email}
      Subject: Reset Your Password
      Body: Click here to reset your password:
      https://example.com/reset-password?token=${token}
      ======================================================
    `);
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation: invalidate old refresh token and issue new one
   */
  async refreshToken(refreshToken: string, deviceInfo?: string, ipAddress?: string): Promise<AuthResponseDto> {
    // Verify refresh token signature and expiration
    let payload: { sub: string; type: string; iat?: number; exp?: number };
    try {
      const verifiedPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      payload = verifiedPayload as { sub: string; type: string; iat?: number; exp?: number };
    } catch (error) {
      this.logger.error('Failed to verify refresh token', error instanceof Error ? error.stack : error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Validate refresh token exists in database and is not revoked
    const validationResult = await this.refreshTokenService.validateRefreshToken(refreshToken);

    if (validationResult.reused) {
      throw new UnauthorizedException('Refresh token reuse detected. Please login again.');
    }

    if (!validationResult.token) {
      throw new UnauthorizedException('Refresh token is invalid, expired, or revoked');
    }
    const storedToken = validationResult.token;

    // Find user by id from payload
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
        'emailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
    }

    // Token rotation: revoke old refresh token (keep for reuse detection)
    await this.refreshTokenService.revokeToken(refreshToken);

    // Exclude password from response
    const userWithoutPassword = user as Omit<User, 'password'>;

    // Generate new tokens (both access and refresh)
    const tokens = await this.generateTokens(user, deviceInfo, ipAddress, storedToken.tokenFamilyId);

    this.logger.log(`Tokens refreshed for user ${user.email}`);

    return {
      ...tokens,
      user: userWithoutPassword as User,
    };
  }

  /**
   * Logout user from current device
   * Revokes refresh token and blacklists access token
   */
  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    // Revoke refresh token
    await this.refreshTokenService.revokeToken(refreshToken);

    // Calculate token expiration for blacklist
    const tokenExpiration = new Date(
      Date.now() + this.parseJwtExpiration(this.configService.get<string>('JWT_EXPIRATION') || '15m'),
    );

    // Blacklist access token to prevent further use
    await this.tokenBlacklistService.addToBlacklist(accessToken, userId, 'logout', tokenExpiration);

    this.logger.log(`User ${userId} logged out from current device`);
  }

  /**
   * Logout user from all devices
   * Revokes all refresh tokens and blacklists current access token
   */
  async logoutAll(userId: string, accessToken: string): Promise<void> {
    // Revoke all refresh tokens for this user
    const revokedCount = await this.refreshTokenService.revokeAllUserTokens(userId);

    // Calculate token expiration for blacklist
    const tokenExpiration = new Date(
      Date.now() + this.parseJwtExpiration(this.configService.get<string>('JWT_EXPIRATION') || '15m'),
    );

    // Blacklist current access token
    await this.tokenBlacklistService.addToBlacklist(accessToken, userId, 'logout', tokenExpiration);

    this.logger.log(`User ${userId} logged out from all devices (${revokedCount} tokens revoked)`);
  }
}
