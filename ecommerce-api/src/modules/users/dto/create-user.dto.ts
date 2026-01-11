/**
 * Create User DTO - Data Transfer Object cho việc tạo user mới
 *
 * DTO này định nghĩa structure và validation rules cho request body của POST /users
 *
 * Validation decorators:
 * - @IsEmail(): Validate email format
 * - @IsNotEmpty(): Field không được rỗng
 * - @MinLength(), @MaxLength(): Validate độ dài string
 * - @Matches(): Validate theo regex pattern
 * - @IsEnum(): Value phải thuộc enum
 * - @IsOptional(): Field có thể không gửi lên
 *
 * Swagger decorators:
 * - @ApiProperty(): Field bắt buộc
 * - @ApiPropertyOptional(): Field optional
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description:
      'User password (min 8 chars, must contain uppercase, lowercase, number)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, and number/special char',
  })
  password: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'User first name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'User last name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.USER,
    description: 'User role',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be user, admin, or staff' })
  role?: UserRole;
}
