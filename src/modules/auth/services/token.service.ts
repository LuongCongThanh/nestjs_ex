import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AUTH_CONFIG } from '../auth.constants';

/**
 * Token Service - Pure utility for standardizing JWT generation and verification.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a standard Access Token with JTI.
   */
  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') || '15m') as any,
      jwtid: this.generateJti(),
    });
  }

  /**
   * Generates a standard Refresh Token with JTI.
   */
  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d') as any,
      jwtid: this.generateJti(),
    });
  }

  /**
   * Generates shorter-lived stateless tokens for email verification or password reset.
   */
  generateStatelessToken(payload: Partial<JwtPayload>, type: 'verify' | 'reset'): string {
    const secret =
      type === 'verify'
        ? this.configService.get<string>('JWT_VERIFICATION_SECRET')
        : this.configService.get<string>('JWT_RESET_SECRET');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const expiresIn = (
      type === 'verify'
        ? `${AUTH_CONFIG.EMAIL_VERIFICATION_TOKEN_TTL_HOURS}h`
        : `${AUTH_CONFIG.PASSWORD_RESET_TOKEN_TTL_MINUTES}m`
    ) as any;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.jwtService.sign(payload, { secret, expiresIn, jwtid: this.generateJti() });
  }

  /**
   * Verifies and decodes a stateless token.
   */
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

  /**
   * Verifies and decodes a Refresh Token.
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generates a random unique identifier for JWT ID (jti) claim.
   */
  private generateJti(): string {
    return randomBytes(16).toString('hex');
  }
}
