import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') || '15m') as any,
      jwtid: this.generateJti(),
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '30d') as any,
      jwtid: this.generateJti(),
    });
  }

  generateStatelessToken(payload: Partial<JwtPayload>, type: 'verify' | 'reset'): string {
    const secret =
      type === 'verify'
        ? this.configService.get<string>('JWT_VERIFICATION_SECRET')
        : this.configService.get<string>('JWT_RESET_SECRET');

    const expiresIn = type === 'verify' ? '1d' : '15m';

    return this.jwtService.sign(payload, { secret, expiresIn, jwtid: this.generateJti() });
  }

  verifyStatelessToken(token: string, type: 'verify' | 'reset'): JwtPayload {
    const secret =
      type === 'verify'
        ? this.configService.get<string>('JWT_VERIFICATION_SECRET')
        : this.configService.get<string>('JWT_RESET_SECRET');

    try {
      return this.jwtService.verify<JwtPayload>(token, { secret });
    } catch {
      throw new Error('Invalid token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  private generateJti(): string {
    return randomBytes(16).toString('hex');
  }
}
