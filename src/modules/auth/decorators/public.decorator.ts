import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark an endpoint as public.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
