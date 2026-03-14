import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Get User Decorator
 *
 * Extracts the authenticated user from the request object.
 * User is set by JwtAuthGuard after successful authentication.
 *
 * @returns The authenticated User object
 */
export const GetUser = createParamDecorator((data: keyof User | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user as User;

  // If specific property is requested, return that property
  return data ? user?.[data] : user;
});
