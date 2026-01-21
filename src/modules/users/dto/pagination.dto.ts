import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Base Pagination Query parameters.
 * Extend this DTO for any endpoint requiring simple pagination.
 */
export class PaginationQueryDto {
  /** The page index (starts from 1). */
  @ApiProperty({
    description: 'The requested page number',
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** The maximum number of results per page. */
  @ApiProperty({
    description: 'Maximum number of items to return in a single page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

/**
 * Pagination Metadata.
 * Provides details about the current state of a paginated list.
 */
export class PaginationMetaDto {
  /** Current page index. */
  @ApiProperty({ example: 1, description: 'The current page index' })
  page: number;

  /** Actual items per page. */
  @ApiProperty({ example: 10, description: 'The maximum results per page' })
  limit: number;

  /** Total number of records across all pages. */
  @ApiProperty({ example: 100, description: 'Total record count in the database' })
  total: number;

  /** Calculated total page count. */
  @ApiProperty({ example: 10, description: 'Total number of available pages' })
  totalPages: number;

  /** Indicates if there is a following page. */
  @ApiProperty({ example: true, description: 'Whether a next page exists' })
  hasNextPage: boolean;

  /** Indicates if there is a preceding page. */
  @ApiProperty({
    example: false,
    description: 'Whether a previous page exists',
  })
  hasPreviousPage: boolean;
}

/**
 * Generic Paginated Response structure.
 * Wraps list data with pagination metadata for client use.
 */
export class PaginatedResponseDto<T> {
  /** List of entity data for the current page. */
  @ApiProperty({ description: 'The paginated results array' })
  data: T[];

  /** Pagination details for the returned data. */
  @ApiProperty({ type: PaginationMetaDto, description: 'Metadata for navigation' })
  meta: PaginationMetaDto;
}
