import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../entities/user.entity';

/**
 * Key metadata dùng để lưu trữ danh sách các vai trò (roles) được phép truy cập.
 * Key này sẽ được RolesGuard sử dụng để kiểm tra quyền hạn của người dùng.
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Decorator này dùng để chỉ định danh sách các vai trò (UserRole) cần thiết để truy cập một route.
 * Nó lưu trữ danh sách roles vào metadata của method hoặc class.
 * Để decorator này có tác dụng, bạn phải sử dụng kèm với RolesGuard.
 *
 * @param roles - Danh sách một hoặc nhiều vai trò (Admin, User, Staff, v.v.)
 *
 * @example
 * // Chỉ cho phép Admin truy cập
 * @Roles(UserRole.ADMIN)
 * @Get('admin-dashboard')
 * adminOnly() { ... }
 *
 * @example
 * // Cho phép cả Admin và Staff truy cập
 * @Roles(UserRole.ADMIN, UserRole.STAFF)
 * @Get('management')
 * staffOnly() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
