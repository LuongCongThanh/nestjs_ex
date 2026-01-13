/**
 * Pagination DTOs - Các DTO cho pagination và response format
 *
 * File này chứa 3 DTOs:
 * 1. PaginationQueryDto: Base query params cho pagination (page, limit)
 * 2. PaginationMetaDto: Metadata về pagination (total, totalPages, hasNext, hasPrevious)
 * 3. PaginatedResponseDto<T>: Generic response format với data + meta
 *
 * Sử dụng:
 * - Extend PaginationQueryDto trong các query DTOs khác
 * - Service trả về dạng: { data: T[], meta: PaginationMetaDto }
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Base Pagination Query DTO
 * Dùng làm base class cho các query DTOs khác
 */
export class PaginationQueryDto {
  @ApiProperty({
    description: 'Page number (starts from 1)',
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number) // Transform string → number
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number) // Transform string → number
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

/**
 * Pagination Metadata DTO
 * Chứa thông tin về pagination state
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number; // Trang hiện tại

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number; // Số items mỗi trang

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number; // Tổng số items trong database

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number; // Tổng số pages (Math.ceil(total / limit))

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  hasNextPage: boolean; // page < totalPages

  @ApiProperty({
    example: false,
    description: 'Whether there is a previous page',
  })
  hasPreviousPage: boolean; // page > 1
}

/**
 * Generic Paginated Response DTO
 * Format chuẩn cho response có pagination
 *
 * Usage:
 * - GET /users → PaginatedResponseDto<User>
 * - GET /products → PaginatedResponseDto<Product>
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  data: T[]; // Danh sách items

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto; // Pagination metadata
}
