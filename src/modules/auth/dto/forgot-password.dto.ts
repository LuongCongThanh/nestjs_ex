import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for requesting a password reset.
 *
 * Used when a user has forgotten their password and needs to initiate the reset flow via email.
 *
 * SECURITY NOTE:
 * - Always returns a success message even if the email is not found to prevent account enumeration.
 * - Reset tokens are sent strictly via email and have a short expiration time.
 */
export class ForgotPasswordDto {
  /**
   * User email address where the reset link will be sent.
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send password reset link',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
