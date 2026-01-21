import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Verified Guard - Enforces email verification.
 * Ensures that the authenticated user has a verified email address.
 */
@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: { emailVerified: boolean } }>();

    if (user && !user.emailVerified) {
      throw new ForbiddenException('Email not verified. Please verify your email to access this resource.');
    }

    return true;
  }
}
