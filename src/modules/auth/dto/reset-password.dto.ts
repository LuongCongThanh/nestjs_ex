import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

/**
 * Data Transfer Object for resetting the user's password.
 *
 * Used after a user has successfully initiated a password reset and received a token via email.
 */
export class ResetPasswordDto {
  /**
   * The secure reset token sent to the user's email.
   * One-time use only and expires quickly (15-30 minutes).
   */
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token from email',
  })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  /**
   * The new password to be established.
   * Must meet the 2026 security strength requirements.
   */
  @ApiProperty({
    example: 'NewPassword@123',
    description: 'New password (min 8 characters, must contain uppercase, lowercase, and number)',
    minLength: 8,
  })
  @IsStrongPassword()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  newPassword: string;
}
