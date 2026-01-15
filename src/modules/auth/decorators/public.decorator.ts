import { SetMetadata } from '@nestjs/common';

/**
 * Key metadata used to identify public routes.
 * This key will be used by JwtAuthGuard to check if authentication should be skipped.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * This decorator is used to mark a route (method) or a Controller (class) as "Public".
 * When a route is marked with @Public(), JwtAuthGuard will skip JWT token validation,
 * allowing anyone to access it without logging in.
 *
 * @example
 * // Allow access to register endpoint without token
 * @Public()
 * @Post('register')
 * register() { ... }
 *
 * @example
 * // Allow access to health check endpoint
 * @Public()
 * @Get('health')
 * healthCheck() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
