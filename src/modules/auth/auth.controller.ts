import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { RegistrationResponseDto } from '@modules/auth/dto/registration-response.dto';
import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
// ... (rest of imports)
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ... (register)

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
    const result = await this.authService.login(loginDto);
    return plainToInstance(AuthResponseDto, result);
  }

  // ... (forgotPassword)

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
    const result = await this.authService.refreshToken(refreshTokenDto.refreshToken, userAgent, ipAddress);
    return plainToInstance(AuthResponseDto, result);
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
