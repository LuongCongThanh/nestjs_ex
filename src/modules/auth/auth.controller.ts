import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { RegistrationResponseDto } from '@modules/auth/dto/registration-response.dto';
import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  BadRequestResponse,
  ConflictResponse,
  ForgotPasswordResponse,
  LoginResponse,
  RegisterResponse,
  UnauthorizedResponse,
} from './docs/auth.responses';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account. Email must be unique. Password will be hashed automatically. ' +
      'Returns success message and sends verification email. User must verify email before login.',
  })
  @RegisterResponse
  @BadRequestResponse
  @ConflictResponse
  async register(@Body() registerDto: RegisterDto): Promise<RegistrationResponseDto> {
    return await this.authService.register(registerDto);
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
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates user with email and password. Returns JWT token and user information.',
  })
  @LoginResponse
  @UnauthorizedResponse
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
  @ApiOperation({
    summary: 'Refresh JWT tokens',
    description: 'Refreshes access and refresh tokens. Implements token rotation for security.',
  })
  @LoginResponse
  @UnauthorizedResponse
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
  @ApiOperation({
    summary: 'Logout from current device',
    description: 'Logs out user from current device. Revokes refresh token and blacklists access token.',
  })
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
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Logs out user from all devices. Revokes all refresh tokens and blacklists current access token.',
  })
  async logoutAll(@Req() req: Request): Promise<{ message: string }> {
    const user = req.user as any;
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

    await this.authService.logoutAll(user.id, accessToken);

    return { message: 'Logged out from all devices successfully' };
  }
}
