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

interface JwtPayload {
  sub: number;
  email: string;
  roles?: string[];
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly accessTtl: string; // e.g. '15m'
  private readonly refreshSecret: string;
  private readonly refreshTtl: string; // e.g. '7d'

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {
    this.accessSecret =
      this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret';
    this.accessTtl = this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
    this.refreshSecret =
      this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev_refresh_secret';
    this.refreshTtl = this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';
  }

  // local typed wrapper for bcryptjs to avoid any/unsafe ESLint issues in nodenext
  private readonly bcrypt: {
    genSalt(rounds?: number): Promise<string>;
    hash(data: string, salt: string | number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
  } = bcryptJs as unknown as {
    genSalt(rounds?: number): Promise<string>;
    hash(data: string, salt: string | number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
  };

  // Helpers
  private async hashPassword(password: string): Promise<string> {
    const salt = await this.bcrypt.genSalt(10);
    return await this.bcrypt.hash(password, salt);
  }

  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await this.bcrypt.compare(password, hash);
  }

  private sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl,
    });
  }

  private async signRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl,
    });
  }

  private async storeRefreshToken(
    userId: number,
    token: string,
  ): Promise<void> {
    const tokenHash = this.sha256(token);
    const expiresAt = new Date(
      Date.now() + this.parseDurationMs(this.refreshTtl),
    );
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  private parseDurationMs(duration: string): number {
    // naive parser for s,m,h,d
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
  }

  private sanitizeUser<T extends { password?: string }>(
    user: T,
  ): Omit<T, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const exists = await this.users.emailExists(dto.email);
    if (exists) {
      throw new ConflictException(
        'Email is already being used by another user',
      );
    }

    const hashed = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashed,
        phone: dto.phone,
        roles: [],
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);
    await this.storeRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.verifyPassword(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);
    await this.storeRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    if (!refreshToken)
      throw new BadRequestException('Refresh token is required');

    // Verify signature & extract payload
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check token is stored and not revoked/expired
    const tokenHash = this.sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });
    if (!stored)
      throw new UnauthorizedException(
        'Refresh token not recognized or expired',
      );

    // Rotate: revoke old and issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const [accessToken, newRefreshToken] = await Promise.all([
      this.signAccessToken(newPayload),
      this.signRefreshToken(newPayload),
    ]);
    await this.storeRefreshToken(user.id, newRefreshToken);
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(
    userId: number,
    all = false,
    refreshToken?: string,
  ): Promise<void> {
    if (all) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
      return;
    }
    if (!refreshToken)
      throw new BadRequestException(
        'Refresh token is required to logout single session',
      );
    const tokenHash = this.sha256(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revoked: false },
      data: { revoked: true },
    });
  }
}
