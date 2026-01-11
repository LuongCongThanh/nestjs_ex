import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  BadRequestResponse,
  ConflictResponse,
  LoginResponse,
  RegisterResponse,
  UnauthorizedResponse,
} from './docs/auth.responses';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
