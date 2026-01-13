/**
 * User Response DTO - Data Transfer Object cho response trả về client
 *
 * DTO này định nghĩa structure của User object trong response
 *
 * Security:
 * - @Exclude(): Mặc định loại bỏ TẤT CẢ fields
 * - @Expose(): Chỉ các fields có decorator này mới được trả về
 * - Password field không có @Expose() → không bao giờ trả về client
 *
 * Cách hoạt động:
 * 1. User entity từ database có đầy đủ fields (bao gồm password)
 * 2. ClassSerializerInterceptor transform User → UserResponseDto
 * 3. Chỉ các fields có @Expose() được include trong JSON response
 * 4. Password và các sensitive fields bị loại bỏ tự động
 *
 * Swagger:
 * - Tất cả fields đều có @ApiProperty() để hiển thị trong documentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude() // Mặc định loại bỏ tất cả fields
export class UserResponseDto {
  @Expose() // Chỉ fields có @Expose() mới được trả về
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User unique identifier',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @Expose()
  @ApiProperty({
    example: 'John',
    description: 'User first name',
    nullable: true,
  })
  firstName: string | null;

  @Expose()
  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    nullable: true,
  })
  lastName: string | null;

  @Expose()
  @ApiProperty({
    example: '0123456789',
    description: 'User phone number',
    nullable: true,
  })
  phone: string | null;

  @Expose()
  @ApiProperty({
    enum: ['user', 'admin', 'staff'],
    example: 'user',
    description: 'User role',
  })
  role: string;

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Whether user account is active',
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'Whether user email is verified',
  })
  emailVerified: boolean;

  @Expose()
  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'User creation timestamp',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'User last update timestamp',
  })
  updatedAt: Date;
}
