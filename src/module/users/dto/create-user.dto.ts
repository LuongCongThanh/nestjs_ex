import {
  IsFullName,
  IsOptionalPhone,
  IsUserEmail,
  IsUserPassword,
} from '../decorators/validation.decorators';

/**
 * Data Transfer Object for creating a new user
 */
export class CreateUserDto {
  @IsFullName()
  readonly fullName: string;

  @IsUserEmail()
  readonly email: string;

  @IsUserPassword()
  readonly password: string;

  @IsOptionalPhone()
  readonly phone?: string;
}
