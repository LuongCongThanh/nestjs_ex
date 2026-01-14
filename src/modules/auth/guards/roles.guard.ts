import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard
 *
 * Guard này dùng để kiểm tra xem người dùng đã đăng nhập có đủ quyền (Role)
 * để truy cập vào route này hay không.
 * Thường được dùng kết hợp với decorator @Roles().
 *
 * Lưu ý: Guard này phải chạy SAU JwtAuthGuard để có thông tin user trong request.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Phương thức kiểm tra quyền truy cập dựa trên Role.
   * @param context Ngữ cảnh thực thi của request
   */
  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách các Roles được yêu cầu từ decorator @Roles()
    // Nó sẽ kiểm tra ở cấp độ phương thức (handler) trước, sau đó đến cấp độ Controller (class)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Nếu route không yêu cầu Role cụ thể nào, cho phép truy cập luôn
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Lấy thông tin user từ request (thông tin này được JwtAuthGuard gán vào sau khi validate token)
    const { user } = context.switchToHttp().getRequest();

    // 4. Kiểm tra xem Role của user có nằm trong danh sách các Roles được yêu cầu hay không
    // Trả về true nếu khớp, ngược lại trả về false (sẽ gây ra lỗi 403 Forbidden)
    return user?.role ? requiredRoles.includes(user.role) : false;
  }
}
