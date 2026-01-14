import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { RegistrationResponseDto } from '@modules/auth/dto/registration-response.dto';
import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Ip, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  BadRequestResponse,
  ConflictResponse,
  ForbiddenResponse,
  ForgotPasswordResponse,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
  ResendVerificationResponse,
  UnauthorizedResponse,
  VerificationResponse,
} from './docs/auth.responses';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendVerificationLinkDto } from './dto/resend-verification-link.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register new user (2026 Security Implementation)
   * POST /auth/register
   *
   * Creates a new user account with mandatory email verification.
   * Password is automatically hashed with bcrypt 12 rounds before storage.
   *
   * Flow:
   * 1. User submits registration form
   * 2. Server creates user account (emailVerified = false)
   * 3. Server sends verification email with link
   * 4. Server returns success message (NO JWT tokens)
   * 5. User must verify email before login
   *
   * Security Changes (2026):
   * - Does NOT return JWT tokens (must verify email first)
   * - Uses bcrypt 12 rounds instead of 10
   * - Sends email verification link
   *
   * Important: User CANNOT login until email is verified
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 300 } }) // Limit registration attempts (5 per 5 minutes)
  @ApiOperation({
    summary: 'Create a new user account',
    description:
      'Initiates the registration process. An email verification link will be sent to the user. ' +
      'Authentication tokens are NOT issued until the email is verified (2026 Security Requirement).',
  })
  @RegisterResponse
  @BadRequestResponse
  @ConflictResponse
  async register(@Body() registerDto: RegisterDto): Promise<RegistrationResponseDto> {
    return await this.authService.register(registerDto);
  }

  /**
   * Verify email address
   * GET /auth/verify-email?token=xxx
   *
   * Validates the verification token sent via email and activates the user account.
   */
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 600 } }) // Limit verification checks to reduce brute force
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Validates the secure token from the email link and marks the email as verified.',
  })
  @VerificationResponse
  @UnauthorizedResponse
  @BadRequestResponse
  async verifyEmail(@Query('token') token: string): Promise<{ verified: boolean }> {
    return await this.authService.verifyEmail(token);
  }

  /**
   * Resend verification link
   * POST /auth/resend-verification-link
   *
   * Generates and sends a new verification link to the user's email.
   * Invalidates any previously sent links for this user.
   */
  @Post('resend-verification-link')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600 } }) // Limit resend attempts (3 per hour)
  @ApiOperation({
    summary: 'Resend verification link',
    description: 'Generates a new secure verification token and sends it via email.',
  })
  @ResendVerificationResponse
  @BadRequestResponse
  async resendVerificationLink(@Body() resendDto: ResendVerificationLinkDto): Promise<{ emailSent: boolean }> {
    return await this.authService.resendVerificationLink(resendDto);
  }

  /**
   * Login user
   * POST /auth/login
   *
   * Authenticates user with email and password.
   * Returns JWT token for subsequent authenticated requests.
   *
   * Token should be included in Authorization header as:
   * Authorization: Bearer <token>
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300 } }) // Limit login attempts (10 per 5 minutes)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates user with email and password. Returns JWT token and user information.',
  })
  @LoginResponse
  @UnauthorizedResponse
  @ForbiddenResponse
  @BadRequestResponse
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }

  /**
   * Forgot password
   * POST /auth/forgot-password
   *
   * Sends a password reset email to the user.
   * Returns success message.
   *
   * Email should be sent with subject: "Reset Your Password"
   * and body: "Click here to reset: https://app.com/reset?token=xyz"
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Sends a password reset email to the user.',
  })
  @ForgotPasswordResponse
  @BadRequestResponse
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Refresh token
   * POST /auth/refresh
   *
   * Refreshes JWT tokens using a valid refresh token.
   * Returns new access token and refresh token (token rotation).
   *
   * Implements token rotation: old refresh token is invalidated.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 300 } }) // Limit refresh calls
  @ApiOperation({
    summary: 'Refresh JWT tokens',
    description: 'Refreshes access and refresh tokens. Implements token rotation for security.',
  })
  @LoginResponse
  @UnauthorizedResponse
  @ForbiddenResponse
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<AuthResponseDto> {
    return await this.authService.refreshToken(refreshTokenDto.refreshToken, userAgent, ipAddress);
  }

  /**
   * Logout from current device
   * POST /auth/logout
   *
   * Logs out user from current device by revoking the refresh token
   * and blacklisting the access token.
   *
   * Requires authentication.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 300 } })
  @ApiOperation({
    summary: 'Logout current device',
    description: 'Invalidates the current refresh token and blacklists the access token.',
  })
  @LogoutResponse
  @UnauthorizedResponse
  async logout(@Req() req: Request, @Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    const user = req.user as any;
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

    await this.authService.logout(user.id, accessToken, refreshTokenDto.refreshToken);

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   * POST /auth/logout/all
   *
   * Logs out user from all devices by revoking all refresh tokens
   * and blacklisting the current access token.
   *
   * Requires authentication.
   */
  @Post('logout/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 600 } })
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidates all active refresh tokens for the user and blacklists the current access token.',
  })
  @LogoutResponse
  @UnauthorizedResponse
  async logoutAll(@Req() req: Request): Promise<{ message: string }> {
    const user = req.user as any;
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

    await this.authService.logoutAll(user.id, accessToken);

    return { message: 'Logged out from all devices successfully' };
  }
}
