/**
 * Find Users Query DTO - Query parameters cho GET /users
 *
 * DTO này định nghĩa các query parameters và validation rules
 *
 * Parameters:
 * - page: Số trang (min: 1, default: 1)
 * - limit: Số items mỗi trang (min: 1, max: 100, default: 10)
 * - search: Tìm kiếm theo email, firstName, lastName (case-insensitive)
 * - role: Lọc theo role (user | admin | staff)
 * - isActive: Lọc theo trạng thái active (true | false)
 *
 * Type Transformations:
 * - @Type(() => Number): Transform string "1" → number 1
 * - @Type(() => Boolean): Transform string "true" → boolean true
 *
 * Vì query params luôn là string, cần transform sang đúng type
 * Example: ?page=2&limit=10&isActive=true
 *   → page: string "2" → number 2
 *   → limit: string "10" → number 10
 *   → isActive: string "true" → boolean true
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class FindUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number) // Transform string → number
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number) // Transform string → number
  @IsInt()
  @Min(1)
  @Max(100) // Giới hạn max 100 items để tránh performance issue
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by email or name',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string; // Tìm kiếm trong email, firstName, lastName (ILIKE)

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole) // Validate value phải thuộc UserRole enum
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean) // Transform string "true"/"false" → boolean
  isActive?: boolean; // Nếu không gửi, mặc định filter isActive=true trong service
}
