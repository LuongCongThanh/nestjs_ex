import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Transform Response Interceptor
 *
 * Automatically wraps all successful responses in a standard format:
 * {
 *   statusCode: 200,
 *   success: true,
 *   message: "...",
 *   data: { ... }
 * }
 *
 * Usage:
 * - Apply globally in main.ts
 * - Or apply to specific controllers/routes
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // If data is null or undefined, return simple success message
        if (data === null || data === undefined) {
          return {
            statusCode,
            success: true,
            message: this.getDefaultMessage(method, path),
          };
        }

        // If data already has success/message/data structure, return as is
        if (typeof data === 'object' && 'success' in data && 'message' in data) {
          return {
            statusCode,
            ...data,
          };
        }

        // Wrap data in standard format
        return {
          statusCode,
          success: true,
          message: this.getDefaultMessage(method, path),
          data,
        };
      }),
    );
  }

  private getDefaultMessage(method: string, path: string): string {
    if (path.includes('/auth/register')) return 'User registered successfully';
    if (path.includes('/auth/login')) return 'User logged in successfully';
    if (path.includes('/auth/logout')) return 'User logged out successfully';
    if (path.includes('/auth/refresh')) return 'Tokens refreshed successfully';
    if (path.includes('/auth/forgot-password')) return 'Password reset email sent';
    if (path.includes('/auth/reset-password')) return 'Password reset successfully';
    if (path.includes('/auth/change-password')) return 'Password changed successfully';

    // Default messages based on HTTP method
    switch (method) {
      case 'GET':
        return 'Data retrieved successfully';
      case 'POST':
        return 'Created successfully';
      case 'PATCH':
      case 'PUT':
        return 'Updated successfully';
      case 'DELETE':
        return 'Deleted successfully';
      default:
        return 'Operation completed successfully';
    }
  }
}
