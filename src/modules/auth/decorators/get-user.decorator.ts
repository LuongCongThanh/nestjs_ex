import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../../entities/user.entity';

/**
 * Get User Decorator
 *
 * This decorator is used to extract authenticated user information from the request object.
 * The user object is usually assigned to the request by JwtAuthGuard after successful authentication.
 *
 * @returns User object or a specific property of User.
 *
 * @example
 * // Get full user info
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@GetUser() user: User) {
 *   return user;
 * }
 *
 * @example
 * // Get only user ID
 * @Get('my-id')
 * getMyId(@GetUser('id') userId: string) {
 *   return userId;
 * }
 */
export const GetUser = createParamDecorator((data: keyof User | undefined, ctx: ExecutionContext) => {
  // 1. Get request object from Execution Context
  const request = ctx.switchToHttp().getRequest();

  // 2. Get user info (assigned to request.user by JwtAuthGuard previously)
  const user = request.user as User;

  // 3. If a specific key is provided (e.g. @GetUser('id')), return the value of that property.
  // Otherwise, return the full user object.
  return data ? user?.[data] : user;
});
