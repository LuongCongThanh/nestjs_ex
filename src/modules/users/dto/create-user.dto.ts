import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

/**
 * DTO for creating a new user.
 */
export class CreateUserDto {
  /** User's primary email address. */
  @ApiProperty({
    example: 'user@example.com',
    description: 'The unique email address of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  /** User's account password. Must be strong. */
  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password (min 8 chars, must contain uppercase, lowercase, and a number or special character)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50, { message: 'Password cannot exceed 50 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
  })
  password: string;

  /** User's formal first name. */
  @ApiPropertyOptional({
    example: 'Thanh',
    description: "The user's first name",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  /** User's formal last name. */
  @ApiPropertyOptional({
    example: 'Luong',
    description: "The user's last name",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  /** User's primary contact phone number. */
  @ApiPropertyOptional({
    example: '+84987654321',
    description: 'Contact phone number of the user',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  /** User's access role in the system. */
  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.USER,
    description: 'The role assigned to the user for access control',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role specified' })
  role?: UserRole;
}
