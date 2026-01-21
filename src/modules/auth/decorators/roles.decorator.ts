import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../entities/user.entity';

/**
 * Metadata key for roles.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify the required roles for an endpoint.
 * @param roles List of allowed roles.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
