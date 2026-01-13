import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../../entities/user.entity';

/**
 * Get User Decorator
 *
 * Extracts the authenticated user from the request object.
 * User is set by JwtAuthGuard after successful authentication.
 *
 * @returns The authenticated User object
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@GetUser() user: User) {
 *   return user;
 * }
 *
 * @example
 * // Get specific property
 * @Get('my-id')
 * getMyId(@GetUser('id') userId: string) {
 *   return userId;
 * }
 */
export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    // If specific property is requested, return that property
    return data ? user?.[data] : user;
  },
);
