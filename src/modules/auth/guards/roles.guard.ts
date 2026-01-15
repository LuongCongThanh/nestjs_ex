import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard
 *
 * This guard is used to check if the logged-in user has enough permissions (Role)
 * to access this route.
 * Usually used in combination with the @Roles() decorator.
 *
 * Note: This guard must run AFTER JwtAuthGuard to have user information in the request.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Method to check access permission based on Role.
   * @param context Execution context of the request
   */
  canActivate(context: ExecutionContext): boolean {
    // 1. Get list of required Roles from @Roles() decorator
    // It checks at method level (handler) first, then Controller level (class)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. If route does not require any specific Role, allow access immediately
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Get user info from request (this info is assigned by JwtAuthGuard after token validation)
    const { user } = context.switchToHttp().getRequest();

    // 4. Check if user's Role is in the list of required Roles
    // Return true if matched, otherwise return false (will cause 403 Forbidden error)
    return user?.role ? requiredRoles.includes(user.role) : false;
  }
}
