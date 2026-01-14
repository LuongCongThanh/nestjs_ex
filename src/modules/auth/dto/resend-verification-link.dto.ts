import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for requesting a new email verification link.
 *
 * Used when a user did not receive the initial verification email or the previous link expired.
 */
export class ResendVerificationLinkDto {
  /**
   * User email address where the new verification link will be sent.
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
