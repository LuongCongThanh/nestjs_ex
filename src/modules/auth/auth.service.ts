import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as cryptoNode from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { ResetToken } from './entities/reset-token.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * Register a new user
   * Steps:
   * 1. Check if email already exists
   * 2. Hash password with bcrypt (10 rounds)
   * 3. Create and save user to database
   * 4. Generate JWT token
   * 5. Return token and user info (without password)
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
      select: ['id'], // Only select id for existence check
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user entity
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Save to database
    const savedUser = await this.userRepository.save(user);

    // Exclude password from response
    const userWithoutPassword = savedUser as Omit<User, 'password'>;

    // Generate JWT tokens (access + refresh)
    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: userWithoutPassword as User,
    };
  }

  /**
   * Login user
   * Steps:
   * 1. Find user by email
   * 2. Verify password with bcrypt.compare
   * 3. Check if user is active
   * 4. Generate JWT token
   * 5. Return token and user info (without password)
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
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
    await this.refreshTokenService.createRefreshToken(refresh_token, user.id, expiresAt, deviceInfo, ipAddress);

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
    const storedToken = await this.refreshTokenService.validateRefreshToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token is invalid, expired, or revoked');
    }

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

    // Token rotation: Delete old refresh token
    await this.refreshTokenService.deleteToken(refreshToken);

    // Exclude password from response
    const userWithoutPassword = user as Omit<User, 'password'>;

    // Generate new tokens (both access and refresh)
    const tokens = await this.generateTokens(user, deviceInfo, ipAddress);

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
