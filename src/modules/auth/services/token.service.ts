import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  generateRefreshToken(payload: any): string {
    return crypto.randomBytes(64).toString('hex');
  }

  generateStatelessToken(payload: any, type: 'verify' | 'reset'): string {
    const secret = type === 'verify' 
      ? this.configService.get('JWT_VERIFICATION_SECRET')
      : this.configService.get('JWT_RESET_SECRET');
    
    const expiresIn = type === 'verify' ? '1d' : '15m';

    return this.jwtService.sign(payload, { secret, expiresIn });
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
}
