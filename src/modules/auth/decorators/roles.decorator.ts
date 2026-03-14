import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Sets required roles for accessing a route.
 * Must be used with RolesGuard.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
