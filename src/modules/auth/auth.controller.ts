import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Ip, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { BadRequestResponse, LoginResponse, UnauthorizedResponse } from './docs/auth.responses';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account. Returns success message and sends verification email.',
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegistrationResponseDto> {
    return this.authService.register(registerDto);
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify email',
    description: 'Verifies user email using the token sent during registration.',
  })
  async verifyEmail(@Query('token') token: string): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset link to the user email if it exists.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'If an account exists with this email, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using the token sent in the reset email.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

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
    return this.authService.login(loginDto);
  }

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
    return this.authService.refreshToken(refreshTokenDto.refreshToken, userAgent, ipAddress);
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
  async logout(
    @Req() req: Request & { user: { id: string } },
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    const { user } = req;
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
  async logoutAll(@Req() req: Request & { user: { id: string } }): Promise<{ message: string }> {
    const { user } = req;
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

    await this.authService.logoutAll(user.id, accessToken);

    return { message: 'Logged out from all devices successfully' };
  }
}
