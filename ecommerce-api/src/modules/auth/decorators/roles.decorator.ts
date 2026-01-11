import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../entities/user.entity';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Sets required roles for accessing a route.
 * Must be used with RolesGuard.
 *
 * @param roles - One or more UserRole values
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @Get('admin')
 * adminOnly() { ... }
 *
 * @example
 * @Roles(UserRole.ADMIN, UserRole.STAFF)
 * @Get('staff')
 * staffOnly() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
