import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenBlacklistService } from '../services/token-blacklist.service';

interface RequestWithAuth extends Request {
  user?: Pick<User, 'id' | 'email' | 'role' | 'isActive'>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
      passReqToCallback: true, // Enable request in validate method
    });
  }

  async validate(req: RequestWithAuth, payload: JwtPayload): Promise<Pick<User, 'id' | 'email' | 'role' | 'isActive'>> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token && (await this.tokenBlacklistService.isBlacklisted(token))) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException('Invalid token or user not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
    }

    return user;
  }
}
