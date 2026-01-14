import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

/**
 * Data Transfer Object for user registration.
 *
 * Used to:
 * 1. Validate input data for new user accounts.
 * 2. Document the registration endpoint in Swagger.
 * 3. Enforce 2026 security standards for passwords and verification.
 *
 * @example
 * POST /auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "Password@123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "phone": "+1234567890"
 * }
 */
export class RegisterDto {
  /**
   * User email address. Must be unique in the system.
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * User password. Must meet 2026 security strength requirements.
   * Will be hashed using bcrypt (12 rounds) before storage.
   */
  @ApiProperty({
    example: 'Password@123',
    description:
      'Password must be at least 8 characters and contain uppercase, lowercase, and number or special character',
    minLength: 8,
  })
  @IsStrongPassword()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  /**
   * User's first name.
   */
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  /**
   * User's last name.
   */
  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  /**
   * User's phone number. Optional.
   */
  @ApiProperty({
    example: '0987654321',
    description: 'User phone number (optional)',
    required: false,
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phone?: string;
}
