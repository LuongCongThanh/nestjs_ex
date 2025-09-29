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
import { LoginDto } from 'src/auth/dto/login.dto';
import { RefreshDto } from 'src/auth/dto/refresh.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { AuthTokensDto } from 'src/auth/dto/tokens.dto';
import { AuthService } from './auth.service';

@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') { }

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

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
  @ApiOperation({ summary: 'Refresh access token with refresh token' })
  @ApiBody({ type: RefreshDto })
  async refresh(@Body() dto: RefreshDto): Promise<AuthTokensDto> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request & { user?: { sub?: number } },
  ): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Missing authenticated user');
    const token = req.get('x-refresh-token') ?? undefined;
    await this.auth.logout(userId, false, token);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout all sessions (requires access token)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @Req() req: Request & { user?: { sub?: number } },
  ): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Missing authenticated user');
    await this.auth.logout(userId, true);
  }
}
