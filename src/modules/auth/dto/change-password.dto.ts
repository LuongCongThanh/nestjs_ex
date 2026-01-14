import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

/**
 * Data Transfer Object for changing the user's password.
 *
 * Used when an authenticated user wants to update their current password.
 *
 * SECURITY NOTE:
 * - Requires verification of the current (old) password.
 * - Enforces 2026 security strength requirements for the new password.
 */
export class ChangePasswordDto {
  /**
   * The user's current password for verification.
   */
  @ApiProperty({
    example: 'OldPassword@123',
    description: 'Current password',
  })
  @IsString({ message: 'Old password must be a string' })
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword: string;

  /**
   * The new password to be established.
   */
  @ApiProperty({
    example: 'NewPassword@123',
    description: 'New password (min 8 characters, must contain uppercase, lowercase, and number)',
    minLength: 8,
  })
  @IsStrongPassword()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}
