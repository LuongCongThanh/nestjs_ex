import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
      jwtid: this.generateJti(),
    });
  }

  generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '30d',
      jwtid: this.generateJti(),
    });
  }

  generateStatelessToken(payload: any, type: 'verify' | 'reset'): string {
    const secret = type === 'verify' 
      ? this.configService.get('JWT_VERIFICATION_SECRET')
      : this.configService.get('JWT_RESET_SECRET');
    
    const expiresIn = type === 'verify' ? '1d' : '15m';

    return this.jwtService.sign(payload, { secret, expiresIn, jwtid: this.generateJti() });
  }

  verifyStatelessToken(token: string, type: 'verify' | 'reset'): any {
    const secret = type === 'verify' 
      ? this.configService.get('JWT_VERIFICATION_SECRET')
      : this.configService.get('JWT_RESET_SECRET');
      
    try {
      return this.jwtService.verify(token, { secret });
    } catch (e) {
      throw new Error('Invalid token');
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      return this.jwtService.verify(token, { secret: this.configService.get('JWT_REFRESH_SECRET') });
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
  }

  private generateJti(): string {
    return randomBytes(16).toString('hex');
  }
}
