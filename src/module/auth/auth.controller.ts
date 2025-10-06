import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Injectable,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  AuthTokensDto,
  ROLE_ADMIN,
  ROLE_USER,
  Roles,
  RolesGuard,
} from 'src/common';
import { AuthService } from 'src/module/auth/auth.service';
import { LoginDto } from 'src/module/auth/dto/login.dto';
import { RefreshDto } from 'src/module/auth/dto/refresh.dto';
import { RegisterDto } from 'src/module/auth/dto/register.dto';

@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto): Promise<AuthTokensDto> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshDto })
  async refresh(@Body() dto: RefreshDto): Promise<AuthTokensDto> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout current session' })
  @ApiBearerAuth('JWT-auth')
  @Roles(ROLE_USER, ROLE_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async logout(
    @Req() req: Request & { user?: { sub?: number } },
  ): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const token = req.get('x-refresh-token') ?? undefined;
    await this.auth.logout(userId, false, token);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout all sessions' })
  @ApiBearerAuth('JWT-auth')
  @Roles(ROLE_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async logoutAll(
    @Req() req: Request & { user?: { sub?: number } },
  ): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    await this.auth.logout(userId, true);
  }
}
