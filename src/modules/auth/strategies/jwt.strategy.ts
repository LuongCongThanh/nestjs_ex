import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenBlacklistService } from '../services/token-blacklist.service';

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

  async validate(req: any, payload: JwtPayload): Promise<User> {
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
