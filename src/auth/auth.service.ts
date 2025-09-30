import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcryptJs from 'bcryptjs';
import * as crypto from 'crypto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { AuthTokensDto } from 'src/auth/dto/tokens.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  // Lưu trữ các config JWT để tránh phải đọc từ config nhiều lần
  private readonly accessSecret: string; // Secret key để ký access token
  private readonly accessTtl: string; // Thời gian sống của access token (VD: '15m')
  private readonly refreshSecret: string; // Secret key để ký refresh token
  private readonly refreshTtl: string; // Thời gian sống của refresh token (VD: '7d')

  constructor(
    private readonly jwt: JwtService, // Service để ký và verify JWT
    private readonly prisma: PrismaService, // Service để truy cập database
    private readonly users: UsersService, // Service xử lý logic user
    private readonly config: ConfigService, // Service đọc cấu hình từ .env
  ) {
    // Đọc và cache các giá trị config JWT từ file .env
    // Nếu không có thì dùng giá trị mặc định cho môi trường dev
    this.accessSecret =
      this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret';
    this.accessTtl = this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
    this.refreshSecret =
      this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev_refresh_secret';
    this.refreshTtl = this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';
  }

  // Wrapper có type an toàn cho bcryptjs
  // Tránh lỗi ESLint về any/unsafe khi dùng nodenext
  private readonly bcrypt: {
    genSalt(rounds?: number): Promise<string>;
    hash(data: string, salt: string | number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
  } = bcryptJs as unknown as {
    genSalt(rounds?: number): Promise<string>;
    hash(data: string, salt: string | number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
  };

  // ========== CÁC HÀM HELPER PRIVATE ==========

  // Mã hóa mật khẩu dạng plaintext với salt ngẫu nhiên
  private async hashPassword(password: string): Promise<string> {
    const salt = await this.bcrypt.genSalt(10); // Tạo salt với độ phức tạp 10
    return await this.bcrypt.hash(password, salt); // Hash password với salt
  }

  // So sánh mật khẩu plaintext với hash đã lưu trong DB
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await this.bcrypt.compare(password, hash);
  }

  // Tạo mã hash SHA-256 để lưu refresh token vào DB
  // Không lưu token gốc để bảo mật (tương tự như không lưu password gốc)
  private sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  // Ký access token có thời gian sống ngắn (thường 15 phút)
  // Chứa thông tin user để xác thực các request
  private async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl,
    });
  }

  // Ký refresh token có thời gian sống dài (thường 7 ngày)
  // Dùng để lấy access token mới khi hết hạn
  private async signRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl,
    });
  }

  // Lưu hash của refresh token vào DB để có thể thu hồi sau này
  // Không lưu token gốc vì lý do bảo mật
  private async storeRefreshToken(
    userId: number,
    token: string,
  ): Promise<void> {
    const tokenHash = this.sha256(token); // Hash token trước khi lưu
    // Tính thời gian hết hạn
    const expiresAt = new Date(
      Date.now() + this.parseDurationMs(this.refreshTtl),
    );
    // Tạo record mới trong bảng refreshToken
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  // Chuyển đổi chuỗi thời gian (VD: '15m', '7d') thành milliseconds
  private parseDurationMs(duration: string): number {
    // Parser đơn giản cho các đơn vị: s (giây), m (phút), h (giờ), d (ngày)
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    // Bảng quy đổi sang milliseconds
    const multipliers: Record<string, number> = {
      s: 1000, // giây
      m: 60 * 1000, // phút
      h: 60 * 60 * 1000, // giờ
      d: 24 * 60 * 60 * 1000, // ngày
    };
    return value * multipliers[unit];
  }

  // Loại bỏ trường password nhạy cảm trước khi trả về thông tin user
  private sanitizeUser<T extends { password?: string | null }>(
    user: T,
  ): Omit<T, 'password'> {
    const { password: _password, ...rest } = user;
    void _password; // Đánh dấu biến không dùng để tránh warning
    return rest;
  }

  // ========== CÁC HÀM PUBLIC - LOGIC NGHIỆP VỤ CHÍNH ==========

  // ĐĂNG KÝ: Tạo user mới và phát hành cặp token đầu tiên
  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    // Kiểm tra email đã tồn tại chưa
    const exists = await this.users.emailExists(dto.email);
    if (exists) {
      throw new ConflictException(
        'Email is already being used by another user',
      );
    }

    // Hash mật khẩu trước khi lưu DB
    const hashed = await this.hashPassword(dto.password);

    // Tạo user mới trong database
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashed,
        phone: dto.phone,
        roles: [], // Mảng roles rỗng cho user mới
      },
    });

    // Tạo payload chứa thông tin user để đưa vào JWT
    const payload: JwtPayload = {
      sub: user.id, // sub (subject) = user id
      email: user.email,
      roles: user.roles,
    };

    // Ký cả access và refresh token đồng thời (song song) để tăng tốc
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    // Lưu refresh token vào DB để quản lý
    await this.storeRefreshToken(user.id, refreshToken);

    // Trả về tokens và thông tin user (đã loại bỏ password)
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  // ĐĂNG NHẬP: Xác thực credentials và trả về tokens mới
  async login(dto: LoginDto): Promise<AuthTokensDto> {
    // Tìm user theo email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify mật khẩu
    const ok = await this.verifyPassword(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Tạo payload JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    // Ký cả 2 tokens song song
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    // Lưu refresh token mới vào DB
    await this.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  // LÀM MỚI TOKEN: Xác thực refresh token cũ và phát hành cặp token mới
  // (Token Rotation - thu hồi token cũ, phát hành token mới)
  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    if (!refreshToken)
      throw new BadRequestException('Refresh token is required');

    // Bước 1: Verify chữ ký và giải mã payload từ refresh token
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Bước 2: Kiểm tra token có tồn tại trong DB và còn hợp lệ không
    const tokenHash = this.sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revoked: false, // Chưa bị thu hồi
        expiresAt: { gt: new Date() }, // Chưa hết hạn
      },
    });
    if (!stored)
      throw new UnauthorizedException(
        'Refresh token not recognized or expired',
      );

    // Bước 3: Token Rotation - Thu hồi token cũ
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true }, // Đánh dấu đã thu hồi
    });

    // Bước 4: Lấy thông tin user mới nhất từ DB
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');

    // Bước 5: Tạo payload mới với thông tin user hiện tại
    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    // Bước 6: Ký cặp tokens mới
    const [accessToken, newRefreshToken] = await Promise.all([
      this.signAccessToken(newPayload),
      this.signRefreshToken(newPayload),
    ]);

    // Bước 7: Lưu refresh token mới vào DB
    await this.storeRefreshToken(user.id, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // ĐĂNG XUẤT: Thu hồi refresh token(s)
  // - all = false: Chỉ logout phiên hiện tại (1 token)
  // - all = true: Logout tất cả phiên (tất cả tokens)
  async logout(
    userId: number,
    all = false,
    refreshToken?: string,
  ): Promise<void> {
    // Nếu logout tất cả phiên
    if (all) {
      // Thu hồi tất cả refresh tokens còn active của user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
      return;
    }

    // Nếu logout phiên đơn lẻ
    if (!refreshToken)
      throw new BadRequestException(
        'Refresh token is required to logout single session',
      );

    // Thu hồi refresh token cụ thể
    const tokenHash = this.sha256(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revoked: false },
      data: { revoked: true },
    });
  }
}
