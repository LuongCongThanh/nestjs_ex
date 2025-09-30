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

// Guard bảo vệ để xác thực JWT token
// Đây là wrapper mỏng để có thể inject JWT passport guard vào controller
@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {}

// Đánh dấu controller này thuộc nhóm 'auth' trong Swagger documentation
@ApiTags('auth')
// Định nghĩa route gốc là '/auth' cho tất cả endpoints trong controller này
@Controller('auth')
export class AuthController {
  // Inject AuthService để xử lý logic nghiệp vụ xác thực
  constructor(private readonly auth: AuthService) {}

  // === ENDPOINT ĐĂNG KÝ TÀI KHOẢN MỚI ===
  @Post('register') // Route: POST /auth/register
  @HttpCode(HttpStatus.CREATED) // Trả về HTTP 201 khi tạo thành công
  @ApiOperation({ summary: 'Register a new user' }) // Mô tả cho Swagger
  @ApiBody({ type: RegisterDto }) // Định nghĩa body request cho Swagger
  async register(@Body() dto: RegisterDto): Promise<AuthTokensDto> {
    // Tạo tài khoản người dùng mới và trả về cặp access/refresh token
    return this.auth.register(dto);
  }

  // === ENDPOINT ĐĂNG NHẬP ===
  @Post('login') // Route: POST /auth/login
  @HttpCode(HttpStatus.OK) // Trả về HTTP 200 khi thành công
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    // Xác thực thông tin đăng nhập và trả về tokens mới
    return this.auth.login(dto);
  }

  // === ENDPOINT LÀM MỚI TOKEN ===
  @Post('refresh') // Route: POST /auth/refresh
  @HttpCode(HttpStatus.OK) // Trả về HTTP 200 khi thành công
  @ApiOperation({ summary: 'Refresh access token with refresh token' })
  @ApiBody({ type: RefreshDto })
  async refresh(@Body() dto: RefreshDto): Promise<AuthTokensDto> {
    // Đổi refresh token hợp lệ lấy cặp token mới (token rotation)
    // Refresh token cũ sẽ bị vô hiệu hóa, token mới được tạo ra
    return this.auth.refresh(dto.refreshToken);
  }

  // === ENDPOINT ĐĂNG XUẤT PHIÊN HIỆN TẠI ===
  @Post('logout') // Route: POST /auth/logout
  @ApiBearerAuth('JWT-auth') // Yêu cầu Bearer token trong header Authorization
  @UseGuards(JwtAuthGuard) // Bảo vệ endpoint, chỉ user đã xác thực mới truy cập được
  async logout(
    @Req() req: Request & { user?: { sub?: number } },
  ): Promise<void> {
    // Lấy userId từ JWT payload (sub = subject = user id)
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Missing authenticated user');

    // Lấy refresh token từ header 'x-refresh-token' (nếu có)
    const token = req.get('x-refresh-token') ?? undefined;

    // Vô hiệu hóa refresh token hiện tại
    // Tham số thứ 2 = false nghĩa là chỉ logout phiên hiện tại
    await this.auth.logout(userId, false, token);
  }

  // === ENDPOINT ĐĂNG XUẤT TẤT CẢ PHIÊN ===
  @Post('logout-all') // Route: POST /auth/logout-all
  @HttpCode(HttpStatus.NO_CONTENT) // Trả về HTTP 204 (không có nội dung trả về)
  @ApiOperation({ summary: 'Logout all sessions (requires access token)' })
  @ApiBearerAuth('JWT-auth') // Yêu cầu Bearer token
  @UseGuards(JwtAuthGuard) // Bảo vệ endpoint
  async logoutAll(
    @Req() req: Request & { user?: { sub?: number } },
  ): Promise<void> {
    // Lấy userId từ JWT
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Missing authenticated user');

    // Vô hiệu hóa TẤT CẢ refresh tokens của user
    // Tham số thứ 2 = true nghĩa là logout toàn bộ phiên trên mọi thiết bị
    await this.auth.logout(userId, true);
  }
}
