import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for new user registration.
 */
export class RegisterDto {
  /** The user's email address. Must be unique. */
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  email: string;

  /** The user's password. Must meet complexity requirements. */
  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
    message: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  password: string;

  /** The user's first name. */
  @ApiProperty({ example: 'Thanh', description: 'First Name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @Transform(({ value }) => (value as string)?.trim())
  firstName: string;

  /** The user's last name. */
  @ApiProperty({ example: 'Luong', description: 'Last Name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @Transform(({ value }) => (value as string)?.trim())
  lastName: string;
}
