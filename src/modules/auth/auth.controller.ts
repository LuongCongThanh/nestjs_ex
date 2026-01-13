import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
  constructor(private authService: AuthService) {}

  /**
   * Register new user
   * POST /auth/register
   *
   * Creates a new user account with email verification disabled by default.
   * Password is automatically hashed before storage.
   *
   * Returns JWT token and user information (password excluded).
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account. Email must be unique. Password will be hashed automatically.',
  })
  @RegisterResponse
  @BadRequestResponse
  @ConflictResponse
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
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
    description:
      'Authenticates user with email and password. Returns JWT token and user information.',
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
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
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
    description:
      'Refreshes access and refresh tokens. Implements token rotation for security.',
  })
  @LoginResponse
  @UnauthorizedResponse
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<AuthResponseDto> {
    return await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      userAgent,
      ipAddress,
    );
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
    description:
      'Logs out user from current device. Revokes refresh token and blacklists access token.',
  })
  async logout(
    @Req() req: Request,
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    const user = req.user as any;
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

    await this.authService.logout(
      user.id,
      accessToken,
      refreshTokenDto.refreshToken,
    );

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
    description:
      'Logs out user from all devices. Revokes all refresh tokens and blacklists current access token.',
  })
  async logoutAll(@Req() req: Request): Promise<{ message: string }> {
    const user = req.user as any;
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

    await this.authService.logoutAll(user.id, accessToken);

    return { message: 'Logged out from all devices successfully' };
  }
}
