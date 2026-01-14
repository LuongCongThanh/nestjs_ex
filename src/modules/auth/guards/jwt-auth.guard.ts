import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 *
 * Guard này có nhiệm vụ bảo vệ các route yêu cầu xác thực bằng JWT Token.
 * Nó kiểm tra mã token trong header 'Authorization: Bearer <token>'.
 * Ngoài ra, nó cũng hỗ trợ bỏ qua xác thực nếu route được đánh dấu là @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Phương thức quyết định request có được phép đi tiếp hay không.
   * @param context Ngữ cảnh thực thi của request
   */
  canActivate(context: ExecutionContext) {
    // 1. Kiểm tra xem Controller hoặc Handler (method) có gắn decorator @Public() không
    // reflector.getAllAndOverride sẽ tìm kiếm key IS_PUBLIC_KEY trong meta-data
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Kiểm tra ở cấp độ method
      context.getClass(), // Kiểm tra ở cấp độ class (Controller)
    ]);

    // 2. Nếu route là công khai (isPublic = true), cho phép truy cập mà không cần check token
    if (isPublic) {
      return true;
    }

    // 3. Nếu không phải route công khai, gọi logic xác thực JWT mặc định của Passport
    // logic này sẽ sử dụng JwtStrategy đã cấu hình để validate token
    return super.canActivate(context);
  }
}
