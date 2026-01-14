import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../../entities/user.entity';

/**
 * Get User Decorator
 *
 * Decorator này dùng để trích xuất thông tin người dùng đã được xác thực từ đối tượng request.
 * Đối tượng user thường được JwtAuthGuard gán vào request sau khi xác thực thành công.
 *
 * @returns Đối tượng User hoặc một thuộc tính cụ thể của User.
 *
 * @example
 * // Lấy toàn bộ thông tin user
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@GetUser() user: User) {
 *   return user;
 * }
 *
 * @example
 * // Chỉ lấy ID của user
 * @Get('my-id')
 * getMyId(@GetUser('id') userId: string) {
 *   return userId;
 * }
 */
export const GetUser = createParamDecorator((data: keyof User | undefined, ctx: ExecutionContext) => {
  // 1. Lấy đối tượng request từ ngữ cảnh thực thi (Execution Context)
  const request = ctx.switchToHttp().getRequest();

  // 2. Lấy thông tin user (đã được JwtAuthGuard gán vào request.user trước đó)
  const user = request.user as User;

  // 3. Nếu có truyền vào một key cụ thể (ví dụ @GetUser('id')), trả về giá trị của thuộc tính đó.
  // Ngược lại, trả về toàn bộ đối tượng user.
  return data ? user?.[data] : user;
});
