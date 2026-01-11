/**
 * Error Response DTOs - Các DTO cho error responses
 *
 * File này định nghĩa structure của error responses cho Swagger documentation
 * Giúp client biết được format của error khi gọi API
 *
 * Các loại errors:
 * 1. ErrorResponseDto (400 Bad Request): Validation errors, invalid input
 * 2. ConflictErrorResponseDto (409 Conflict): Resource đã tồn tại (e.g., email duplicate)
 * 3. NotFoundErrorResponseDto (404 Not Found): Resource không tồn tại
 *
 * NestJS tự động tạo error responses theo format này khi throw exceptions
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic Error Response (400 Bad Request)
 * Dùng cho validation errors và invalid input
 */
export class ErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Error type',
  })
  error: string;

  @ApiProperty({
    example: 'Validation failed',
    description: 'Error message',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[]; // String hoặc array of strings (validation errors)

  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'Error timestamp',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/v1/users',
    description: 'Request path',
  })
  path: string;
}

/**
 * Conflict Error Response (409 Conflict)
 * Dùng khi resource đã tồn tại (e.g., email duplicate)
 */
export class ConflictErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({ example: 'User with this email already exists' })
  message: string;

  @ApiProperty({ example: '2026-01-11T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users' })
  path: string;
}

/**
 * Not Found Error Response (404 Not Found)
 * Dùng khi resource không tồn tại
 */
export class NotFoundErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'User with ID xxx not found' })
  message: string;

  @ApiProperty({ example: '2026-01-11T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users/xxx' })
  path: string;
}
