import { Controller, Post, Get, Body, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { VerifiedGuard } from '../guards/verified.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../../entities/user.entity';
import { Request } from 'express';
import * as AuthResponses from '../docs/auth.responses';

/**
 * Auth Controller - Entry point for authentication and session management.
 * Provides endpoints for registration, login, token refresh, and password recovery.
 * Implements rate limiting (throttling) on sensitive actions.
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint for new user registration.
   * Triggers an email verification flow.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 req/hour
  @ApiOperation({ summary: 'Register new account' })
  @AuthResponses.RegisterResponse
  @AuthResponses.ConflictResponse
  @AuthResponses.BadRequestResponse
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Endpoint for verifying email via a link token.
   */
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email (Link from email)' })
  @AuthResponses.VerifyEmailResponse
  @AuthResponses.BadRequestResponse
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Endpoint to resend verification email for a user.
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 req/hour
  @ApiOperation({ summary: 'Resend email verification link' })
  @AuthResponses.ResendVerificationResponse
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  /**
   * Endpoint for user login. Returns access and refresh tokens.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 req/5min
  @ApiOperation({ summary: 'Login to system' })
  @AuthResponses.LoginResponse
  @AuthResponses.UnauthorizedResponse
  @AuthResponses.ForbiddenResponse
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userAgent = (req.headers['user-agent'] as any) || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const ipAddress = (req.ip || (req as any).connection?.remoteAddress || '') as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cleanIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.authService.login(dto, userAgent, cleanIp);
  }

  /**
   * Endpoint to obtain a new access token using a refresh token.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Access Token' })
  @AuthResponses.RefreshTokensResponse
  @AuthResponses.UnauthorizedResponse
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userAgent = (req.headers['user-agent'] as any) || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const ipAddress = (req.ip || (req as any).connection?.remoteAddress || '') as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cleanIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.authService.refresh(dto, userAgent, cleanIp);
  }

  /**
   * Endpoint to revoke a session (logout).
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (Revoke Refresh Token)' })
  @AuthResponses.LogoutResponse
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  /**
   * Endpoint to initiate the forgot password flow.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 req/hour
  @ApiOperation({ summary: 'Request password reset' })
  @AuthResponses.ForgotPasswordResponse
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * Endpoint to set a new password using a reset token.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset new password' })
  @AuthResponses.ResetPasswordResponse
  @AuthResponses.BadRequestResponse
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * Endpoint to change password for an authenticated session.
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change Password (Authenticated)' })
  @AuthResponses.ChangePasswordResponse
  @AuthResponses.UnauthorizedResponse
  async changePassword(@Req() req: { user: { id: string } }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
