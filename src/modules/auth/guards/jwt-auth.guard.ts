import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 *
 * This guard is responsible for protecting routes that require JWT Token authentication.
 * It checks the token in the 'Authorization: Bearer <token>' header.
 * Additionally, it also supports skipping authentication if the route is marked as @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Method to decide if the request allows to proceed.
   * @param context Execution context of the request
   */
  canActivate(context: ExecutionContext) {
    // 1. Check if Controller or Handler (method) has @Public() decorator
    // reflector.getAllAndOverride will search for IS_PUBLIC_KEY in meta-data
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Check at method level
      context.getClass(), // Check at class level (Controller)
    ]);

    // 2. If route is public (isPublic = true), allow access without token check
    if (isPublic) {
      return true;
    }

    // 3. If not public route, call default Passport JWT authentication logic
    // This logic will use configured JwtStrategy to validate token
    return super.canActivate(context);
  }
}
