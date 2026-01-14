import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for user login.
 *
 * Used to:
 * 1. Validate credentials during authentication.
 * 2. Document the login endpoint in Swagger.
 *
 * SECURITY NOTE:
 * - Passwords are transmitted as plain text over HTTPS.
 * - Server compares input with the stored bcrypt hash.
 * - Generic error messages are used to prevent account enumeration.
 *
 * @example
 * POST /auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "Password@123"
 * }
 */
export class LoginDto {
  /**
   * User email address used for login.
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * User password.
   */
  @ApiProperty({
    example: 'Password@123',
    description: 'User password',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
