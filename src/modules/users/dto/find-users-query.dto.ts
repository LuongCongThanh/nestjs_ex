import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

/**
 * DTO for filtering and paginating user lists.
 */
export class FindUsersQueryDto {
  /** Page number for pagination. */
  @ApiPropertyOptional({
    description: 'The page number to retrieve',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Number of items per page. */
  @ApiPropertyOptional({
    description: 'The maximum number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  /** Generic search query for email or name. */
  @ApiPropertyOptional({
    description: 'Search string to filter by email, first name, or last name',
    example: 'thanh',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /** Filter users by their role. */
  @ApiPropertyOptional({
    description: 'Filter users by a specific role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  /** Filter users by account status. */
  @ApiPropertyOptional({
    description: 'Filter users by their active status',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
