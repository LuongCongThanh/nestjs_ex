import { ApiProperty } from '@nestjs/swagger';

/**
 * RegistrationResponseDto
 *
 * Purpose: Response format for successful user registration
 *
 * Important: According to 2026 security best practices,
 * registration does NOT return JWT tokens immediately.
 * Users must verify their email before they can login.
 *
 * Flow:
 * 1. User submits registration form
 * 2. API creates user account (emailVerified = false)
 * 3. API sends verification email with link
 * 4. API returns this response (NO tokens)
 * 5. User clicks link → email verified
 * 6. User can now login and receive tokens
 *
 * Security Benefits:
 * - Ensures email ownership
 * - Prevents fake account creation
 * - Reduces spam and abuse
 * - Complies with 2026 security standards
 */
export class RegistrationResponseDto {
  /**
   * HTTP status code (always 201 for successful registration)
   */
  @ApiProperty({
    example: 201,
    description: 'HTTP status code',
  })
  statusCode: number;

  /**
   * Success flag
   */
  @ApiProperty({
    example: true,
    description: 'Indicates successful registration',
  })
  success: boolean;

  @ApiProperty({
    example: 'Registration successful! Please check your email to verify your account before logging in.',
    description: 'User-friendly success message with further instructions',
  })
  message: string;

  @ApiProperty({
    example: {
      email: 'user@example.com',
      emailSent: true,
    },
    description: 'Additional registration data including email status',
  })
  data: {
    email: string;
    emailSent: boolean;
  };
}
