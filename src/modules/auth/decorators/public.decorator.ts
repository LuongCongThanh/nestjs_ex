import { SetMetadata } from '@nestjs/common';

/**
 * Key metadata dùng để nhận diện các route công khai.
 * Key này sẽ được JwtAuthGuard sử dụng để kiểm tra xem có nên bỏ qua bước xác thực hay không.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * Decorator này dùng để đánh dấu một route (method) hoặc một Controller (class) là "Công khai".
 * Khi một route được gắn @Public(), JwtAuthGuard sẽ bỏ qua việc kiểm tra JWT token,
 * cho phép bất kỳ ai cũng có thể truy cập mà không cần đăng nhập.
 *
 * @example
 * // Cho phép truy cập endpoint đăng ký mà không cần token
 * @Public()
 * @Post('register')
 * register() { ... }
 *
 * @example
 * // Cho phép truy cập endpoint kiểm tra sức khỏe hệ thống
 * @Public()
 * @Get('health')
 * healthCheck() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
