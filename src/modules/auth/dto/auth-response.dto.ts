import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

/**
 * Data Transfer Object for authentication responses.
 *
 * Returns JWT tokens and user profile information after successful login or token refresh.
 */
export class AuthResponseDto {
  /**
   * JWT access token.
   * Should be included in the Authorization header as a Bearer token.
   */
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    description: 'JWT access token (short-lived: 15-30 minutes)',
  })
  access_token: string;

  /**
   * JWT refresh token.
   * Used to obtain a new access token when the current one expires.
   */
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE1MTYyMzkwMjJ9.xyz',
    description: 'JWT refresh token (long-lived: 7-30 days) for renewing access token',
  })
  refresh_token: string;

  /**
   * User profile information.
   * Sensitive data like passwords are never included.
   */
  @ApiProperty({
    type: UserResponseDto,
    description: 'User information (password excluded)',
  })
  user: UserResponseDto;
}
