import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for resetting a password using a token.
 */
export class ResetPasswordDto {
  /** The stateless reset token received via email. */
  @ApiProperty({ example: 'jwt-token-string' })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  /** The new password to be set. */
  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
    message: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  newPassword: string;
}
