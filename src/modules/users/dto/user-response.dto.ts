import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * DTO for user profile responses.
 * Sensitive data like passwords are automatically excluded.
 */
@Exclude()
export class UserResponseDto {
  /** Unique identifier for the user. */
  @Expose()
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique UUID of the user',
  })
  id: string;

  /** User's email address. */
  @Expose()
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address of the user',
  })
  email: string;

  /** User's first name. */
  @Expose()
  @ApiProperty({
    example: 'Thanh',
    description: "The user's first name",
    nullable: true,
  })
  firstName: string | null;

  /** User's last name. */
  @Expose()
  @ApiProperty({
    example: 'Luong',
    description: "The user's last name",
    nullable: true,
  })
  lastName: string | null;

  /** User's phone number. */
  @Expose()
  @ApiProperty({
    example: '+84987654321',
    description: 'Primary contact phone number',
    nullable: true,
  })
  phone: string | null;

  /** User's access role. */
  @Expose()
  @ApiProperty({
    enum: ['user', 'admin', 'staff'],
    example: 'user',
    description: 'User access role in the system',
  })
  role: string;

  /** Account active status. */
  @Expose()
  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is active',
  })
  isActive: boolean;

  /** Email verification status. */
  @Expose()
  @ApiProperty({
    example: false,
    description: 'Indicates if the email address has been verified',
  })
  emailVerified: boolean;

  /** Account creation date. */
  @Expose()
  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'The date and time the user was created',
  })
  createdAt: Date;

  /** Last account update date. */
  @Expose()
  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'The date and time the user was last updated',
  })
  updatedAt: Date;
}
