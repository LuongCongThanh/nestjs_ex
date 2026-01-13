import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * Marks a route as public (bypass JWT authentication).
 * Useful when you have global JWT guard but want some routes to be public.
 *
 * @example
 * @Public()
 * @Post('register')
 * register() { ... }
 *
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
