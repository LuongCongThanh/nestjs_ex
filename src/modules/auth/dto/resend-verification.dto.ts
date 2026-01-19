import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO for requesting a resend of the email verification link.
 */
export class ResendVerificationDto {
  /** The email address to which the verification link should be sent. */
  @ApiProperty({ example: 'user@example.com', description: 'Email to resend verification link' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  email: string;
}
