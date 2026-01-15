import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
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

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    // TODO: Send Email (Replace console.log with EmailService)
    this.logger.log(`[EMAIL] Verify URL for ${savedUser.email}: ${verifyUrl}`);

    return { 
      success: true, 
      statusCode: 201, 
      message: 'Registration successful. Please check your email for verification.' 
    };
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.tokenService.verifyStatelessToken(token, 'verify');
      if (payload.type !== 'verify_email') throw new Error();

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) throw new BadRequestException('User not found');
      
      if (user.emailVerified) {
        throw new BadRequestException('Email already verified');
      }

      user.emailVerified = true;
      await this.userRepository.save(user);

      return { success: true, message: 'Email verified successfully!' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification link.');
    }
  }

  async login(dto: LoginDto, userAgent: string, ipAddress: string) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedException('Account is disabled');
    if (!user.emailVerified) throw new UnauthorizedException('Email not verified');

    return this.generateAuthResponse(user, userAgent, ipAddress);
  }

  async refresh(dto: RefreshTokenDto, userAgent: string, ipAddress: string) {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken },
      relations: ['user'],
    });

    if (!storedToken) throw new UnauthorizedException('Invalid refresh token');
    if (storedToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.remove(storedToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token (Rotation)
    await this.refreshTokenRepository.remove(storedToken);

    return this.generateAuthResponse(storedToken.user, userAgent, ipAddress);
  }

  async logout(dto: RefreshTokenDto) {
    await this.refreshTokenRepository.delete({ token: dto.refreshToken });
    return { success: true, message: 'Logout successful' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) return { success: true, message: 'Check your email to reset password' };

    const resetToken = this.tokenService.generateStatelessToken(
      { sub: user.id, type: 'reset_password' },
      'reset',
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    // TODO: Send Email
    this.logger.log(`[EMAIL] Reset URL for ${user.email}: ${resetUrl}`);

    return { success: true, message: 'Check your email to reset password' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = this.tokenService.verifyStatelessToken(dto.token, 'reset');
      if (payload.type !== 'reset_password') throw new Error();

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) throw new BadRequestException('User not found');

      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(dto.newPassword, salt);
      await this.userRepository.save(user);

      // Force logout all devices
      await this.refreshTokenRepository.delete({ userId: user.id });

      return { success: true, message: 'Password updated successfully!' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Incorrect old password');

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(dto.newPassword, salt);
    await this.userRepository.save(user);

    return { success: true, message: 'Password changed successfully' };
  }

  private async generateAuthResponse(user: User, userAgent: string, ipAddress: string) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshTokenDetails = this.tokenService.generateRefreshToken(payload);

    // Save refresh token to DB
    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refreshTokenDetails,
      userId: user.id,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    // Update last login
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    // Exclude password
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      accessToken,
      refreshToken: refreshTokenDetails,
      user: userWithoutPassword,
    };
  }
}
