import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 *
 * Protects routes by requiring a valid JWT token in the Authorization header.
 * Respects @Public() decorator to allow access to public routes.
 *
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * getProtectedResource() { ... }
 *
 * @Public()
 * @Get('public')
 * getPublicResource() { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Otherwise, use default JWT authentication
    return super.canActivate(context);
  }
}
